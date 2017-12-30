/*
* A small class for helping out with loading the Obj-files with the OBJParser
* /Steffen
*/
let OBJLoadingHelper = function () {
	this.url = null;
	this.request = null;
	this.objectDoc = null;
 }
  
 OBJLoadingHelper.prototype.isFinishedLoading = function ()
 {
	if( this.objectDoc && this.objectDoc.isMTLComplete() ) //ensure both the basic object as well as the material loading request have finished
	{
		return true;
	}
	return false;
 }

  // Parsing the OBJ file
OBJLoadingHelper.prototype.beginReadingObjFromUrl = function (url, scale, reverse)
{
	if(this.request)
	{
		console.log("Already started to download " + url)
	}
	var request = new XMLHttpRequest();
	this.request = request;//assign immidiately to avoid subsequent requests
	request.callbackTarget = this;
	this.url = url;
	request.onreadystatechange = function ()
	{
		if (request.readyState === 4)
		{
			if (request.status === 404)
			{
				console.log("Unable to download " + request.responseURL)
			}
			else {
				request.callbackTarget.handleFinishedObjFile(request.responseText, url, scale, reverse);
			}
		}
	}

	request.open('GET', url, true); // Create a request to get file
	request.send(); // Send the request
}

// OBJ file has been read; now parse it
OBJLoadingHelper.prototype.handleFinishedObjFile = function (fileString, url, scale, reverse)
{
	let objectDoc = new OBJDoc(url); // Create a OBJDoc object
	var result = objectDoc.parse(fileString, scale, reverse);
	if (!result)
	{
		objectDoc = null;
		this.drawingInfo = null;
		console.log("OBJ file parsing error.");
		return;
	}
	this.objectDoc = objectDoc; // do not assign it a member variable before... the isFinishedLoading-function check it
	
	console.log("Successfully loaded OBJ file.");
}
