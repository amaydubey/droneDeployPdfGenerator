/*
This method is called when the generate pdf button is clicked.
*/
function generatePdf(){
	new DroneDeploy({version: 1})
  .then(api => getCurrentlyViewedPlans(api)
  .then(plan => getTiles(api, plan)
  .then(tile => getAnnotations(api, plan)
  .then(annotations => sendTilesToServer(plan.geometry, tile, annotations)
  .then(response => handleResponse(response)
  .then(responseBlob => handleBlob(responseBlob)
  .then(reader => save(reader))))))));
}

/*
This method gets the plan currently being viewed.
*/
function getCurrentlyViewedPlans(api){
  return api.Plans.getCurrentlyViewed();
}

/*
This method gets the tiles from the plan currently being viewed.
*/
function getTiles(api, plan){
  return api.Tiles.get({planId: plan.id, layerName: "ortho", zoom: 17});
}

/*
This method gets the annotations from the plan currently being viewed.
*/
function getAnnotations(api, plan){
  return api.Annotations.get(plan.id);
}

/*
This method sends the file to the droneDeploy server for getting the response as an image made up of tiles.
*/
function sendTilesToServer(planGeo,tileResponse, annotations){
  var body = {
    tiles: tileResponse.tiles,
    planGeo: planGeo,
    zoom_level: 17,
    annotations: annotations
  };

  JSON.stringify(body);
  return fetch("https://dronedeploy-pdf-generator.herokuapp.com/", {
    method: "POST",
    body: JSON.stringify(body)
  });
}

function handleResponse(res){
  return res.blob();
}

/*
This method reads the response from the server and parses it as a binary string.
*/
function handleBlob(resBlob){
  return new Promise((resolve) => {
    var fileReader = new FileReader();
    fileReader.onloadend = () => resolve(fileReader);
    fileReader.readAsBinaryString(resBlob);
  });
}

/*
This method generates the PDF file after adding the image(made up of tiles) obtained from the server.
*/
function save(reader){
  var res = JSON.parse(reader.result);
  var doc = new jsPDF("p","pt");
  doc.addImage(res.image, "JPEG", 120, 150, res.new_width/5, res.new_height/5);
  doc.save("map.pdf");
}