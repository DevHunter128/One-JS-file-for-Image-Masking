function MaskComponent() {

  const body = document.body;
  const img = new Image();
  img.crossOrigin = 'anonymous';

  let isDrawing = false;
  let draggable = false;
  let isMoving = false;
  let onCanvas = false;
  let ab_x = NaN;
  let ab_y = NaN;
  let lastX = 0;
  let lastY = 0;
  let index = 0;
  let scaleF = 0;
  let historyOfMask = [];
  let currentHistory;
  let blurredImageData, originalImageData;


  this.render = () => {
    mainBoard = document.createElement('div');
    mainBoard.style = "width: 100%; display: flex; justify-content: center;";
    document.body.appendChild(mainBoard);

    canvas = document.createElement('canvas');
    canvas.hidden = true;
    canvas.style = "border: solid black 1px;";
    mainBoard.appendChild(canvas);
    ctx = canvas.getContext('2d');

    fileChooser = document.createElement('input');
    fileChooser.hidden = true;
    fileChooser.type = "file";
    fileChooser.accept = "image/*";
    fileChooser.onchange = loadImage;
    mainBoard.appendChild(fileChooser);

    coverOfFileChooser = document.createElement('div');
    coverOfFileChooser.innerText = "Click here to open an image file";
    coverOfFileChooser.style = "padding: 4rem 8rem; border-radius: 1rem; border: solid gray 1px; cursor: pointer; margin-top: 20%;";
    coverOfFileChooser.onclick = () => {
      fileChooser.click();
    };
    mainBoard.appendChild(coverOfFileChooser);

    toolBoard = document.createElement('div');
    toolBoard.style = "width: 100%; display: flex; justify-content: center;";
    document.body.appendChild(toolBoard);

    toolkit = document.createElement('div');
    toolkit.style = "border-radius: 3rem; border: solid gray 1px; padding: 0.4rem 24px; bottom: 0.5rem; position: fixed; display: flex; align-items: center; gap: 16px; justify-content: center;";
    toolBoard.appendChild(toolkit);


    label = document.createElement('label');
    label.for = "slider";
    label.innerText = "Brush";
    toolkit.appendChild(label);

    slider = document.createElement('input');
    slider.name = "slider";
    slider.type = "range";
    slider.min = 5;
    slider.max = 300;
    slider.step = 1;
    slider.value = 20;
    slider.disabled = true;
    toolkit.appendChild(slider);

    _undoB = document.createElement('button');
    _undoB.innerHTML = "<i class=\"fa fa-mail-reply\"></i>";
    _undoB.disabled = true;
    _undoB.onclick = _undo;
    toolkit.appendChild(_undoB);

    _doB = document.createElement('button');
    _doB.innerHTML = "<i class=\"fa fa-mail-forward\"></i>";
    _doB.disabled = true;
    _doB.onclick = _do;
    toolkit.appendChild(_doB);


    originalB = document.createElement('button');
    originalB.innerHTML = "<i class=\"fa fa-eye\"></i>";
    originalB.disabled = true;
    toolkit.appendChild(originalB);

    getMaskB = document.createElement('button');
    getMaskB.innerHTML = "mask";
    getMaskB.disabled = true;
    toolkit.appendChild(getMaskB);

    downloadB = document.createElement('button');
    downloadB.innerHTML = "<i class=\"fa fa-download\"></i>";
    downloadB.disabled = true;
    downloadB.onclick = download;
    toolkit.appendChild(downloadB);

    circleCursor = document.createElement('div');
    circleCursor.style = "width: 20px; height: 20px; border-radius: 50%; background-color: rgba(255, 255, 0, 0.5); position: absolute; pointer-events: none;";
    circleCursor.hidden = true;
    document.body.appendChild(circleCursor);
  }
  this.addEventListeners = () => {
    coverOfFileChooser.addEventListener('mouseover', () => {
      coverOfFileChooser.style = "padding: 4rem 8rem; border-radius: 1rem; cursor: pointer; margin-top: 20%; background-color: rgba(255, 191, 0, 0.8); border: dotted gray 1px;"
    })
    coverOfFileChooser.addEventListener('mouseout', () => {
      coverOfFileChooser.style = "padding: 4rem 8rem; border-radius: 1rem; cursor: pointer; margin-top: 20%; border: solid gray 1px;"
    })

    document.addEventListener("keydown", function (e) {
      if (e.key == ' ') {
        draggable = true;
        circleCursor.hidden = true;
        if (onCanvas) {
          body.style.cursor = 'move';
        }
      }
    });
    document.addEventListener("keyup", function (e) {
      if (e.key == ' ') {
        draggable = false;
        if (onCanvas) {
          circleCursor.hidden = false;
          body.style.cursor = 'none';
        }
      }
    });
    document.addEventListener("mousemove", function (e) {
      // console.log(draggable, isMoving);
      if (draggable && isMoving) {
        let temp = canvas.style.transform.split(', ')
        temp[12] = `${e.pageX - ab_x - img.width / 2}`;
        temp[13] = `${e.pageY - ab_y - img.height / 2}`;
        canvas.style.transform = temp.join(', ');
      }
    })
    document.addEventListener('mouseup', mouseup);
    document.addEventListener("wheel", (e) => {
      // console.log(e.deltaY * 0.01);
      let pscaleF = scaleF;
      scaleF -= e.deltaY * 0.01;
      if (scaleF < -5)
        scaleF = -5;
      else if (scaleF > 10)
        scaleF = 10;
      circleCursor.style.width = circleCursor.style.width.split("px")[0] * (1 + 0.1 * scaleF) / (1 + 0.1 * pscaleF) + "px";
      circleCursor.style.height = circleCursor.style.height.split("px")[0] * (1 + 0.1 * scaleF) / (1 + 0.1 * pscaleF)  + "px";
      let temp = canvas.style.transform.split(', ');
      temp[0] = `matrix3d(${1 + 0.1 * scaleF}`;
      temp[5] = `${1 + 0.1 * scaleF}`;
      canvas.style.transform = temp.join(', ');
      ctx.lineCap = 'round';
    })

    originalB.addEventListener('mousedown', (e) => {
      canvas.style.border = "solid yellow 1px";
      drawOverlay(originalImageData, blurredImageData, historyOfMask[0]);
    });
    originalB.addEventListener('mouseup', (e) => {
      canvas.style.border = "solid black 1px";
      drawOverlay(originalImageData, blurredImageData, historyOfMask[index]);
    })

    getMaskB.addEventListener('mousedown', (e) => {
      canvas.style.border = "solid green 1px";
      getMask();
    });
    getMaskB.addEventListener('mouseup', (e) => {
      canvas.style.border = "solid black 1px";
      drawOverlay(originalImageData, blurredImageData, historyOfMask[index]);
    })

    canvas.addEventListener('mousedown', start);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseout', mouseout);

    slider.oninput = function () {
      ctx.lineWidth = this.value;
      const rect = canvas.getBoundingClientRect();
      circleCursor.style.top = (rect.top + rect.width / 2 - ctx.lineWidth * (1 + 0.1 * scaleF) / 2) + 'px';
      circleCursor.style.left = (rect.left + rect.height / 2 - ctx.lineWidth * (1 + 0.1 * scaleF) / 2) + 'px';
      circleCursor.style.width = ctx.lineWidth * (1 + 0.1 * scaleF) + "px";
      circleCursor.style.height = ctx.lineWidth * (1 + 0.1 * scaleF) + "px";
      circleCursor.hidden = false;
      body.style.cursor = 'none';
    }

    slider.addEventListener('mouseup', function () {
      circleCursor.hidden = true;
      body.style.cursor = 'auto';
    });
  }

  loadImage = () => {
    try {// Get the input element
      coverOfFileChooser.innerText = "Loading...";
      const input = document.querySelector('input[type=file]');
      
      // Create a new FileReader object
      const reader = new FileReader();
      
      // Set up the onload function to draw the image to the canvas
      reader.onload = function(event) {
        img.onload = function() {
            canvas.width = img.width;
            canvas.height = img.height;
            canvas.style.transform = `matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, ${window.innerWidth / 2 - img.width / 2}, ${window.innerHeight / 2 - img.height / 2}, 0, 1)`;
            ctx.lineWidth = 20;
            ctx.lineCap = 'round';
            ctx.strokeStyle = '#000';
            ctx.drawImage(img, 0, 0);
            originalImageData = new ImageData(ctx.getImageData(0, 0, canvas.width, canvas.height).data, canvas.width, canvas.height);
            historyOfMask[0] = [];
            currentHistory = [];
            for (let i = 0; i < canvas.height * canvas.width; i++) {
              historyOfMask[0][i] = false;
            }
            currentHistory = [...historyOfMask[0]];
            blurredImageData = getBlurredImageData(ctx.getImageData(0, 0, canvas.width, canvas.height), [255, 255, 0, 80]);

            coverOfFileChooser.hidden = true;
            canvas.hidden = false;
            slider.disabled = false;
            _doB.disabled = false;
            _undoB.disabled = false;
            originalB.disabled = false;
            getMaskB.disabled = false;
            downloadB.disabled = false;
            mainBoard.style = "width: 100%;  justify-content: center;";
        }
        img.src = event.target.result;
      };
      
      // Read the selected file as a data URL
      reader.readAsDataURL(input.files[0]);
    } catch (err) {
      console.log(err);
      coverOfFileChooser.innerText = "Error! Retry!";
    }
  }

  _undo = () => {
    if (index !== 0) {
      index--;
      currentHistory = [...historyOfMask[index]];
      drawOverlay(originalImageData, blurredImageData, currentHistory);
    }
  }
  _do = () => {
    if (index < historyOfMask.length - 1) {
      index++
      currentHistory = [...historyOfMask[index]];
      drawOverlay(originalImageData, blurredImageData, currentHistory);
    };
  }
  download = () => {
    downloadImageData(new ImageData(ctx.getImageData(0, 0, canvas.width, canvas.height).data, canvas.width, canvas.height), "new.png");
  }

  start = (e) => {
    isDrawing = true;
    isMoving = true;
    let transform = canvas.style.transform.split(', ');
    ab_x = e.pageX - img.width / 2 - transform[12] * 1;
    ab_y = e.pageY - img.height / 2 - transform[13] * 1;
  
    [lastX, lastY] = [e.offsetX, e.offsetY];
  }
  
  // function to draw on the canvas
  draw = (e) => {
    onCanvas = true;
  
    circleCursor.style.top = (e.clientY - circleCursor.style.width.split("px")[0] / 2) + 'px';
    circleCursor.style.left = (e.clientX - circleCursor.style.height.split("px")[0] / 2) + 'px';
    // circleCursor.style.width = ctx.lineWidth + "px";
    // circleCursor.style.height = ctx.lineWidth + "px";
    if (!draggable) {
      circleCursor.hidden = false;
      body.style.cursor = 'none';
  
      if (!isDrawing) return; // stop the function from running when they are not moused down
      ctx.beginPath();
      ctx.moveTo(lastX, lastY);
      ctx.lineTo(e.offsetX, e.offsetY);
      ctx.stroke();
      [lastX, lastY] = [e.offsetX, e.offsetY];
      generateMask()
    }
  }
  
  // function to stop drawing
  stop = () => {
    isDrawing = false;
  }
  
  mouseout = () => {
    onCanvas = false;
    if (isDrawing) {
      index++;
      historyOfMask = (historyOfMask.slice(0,index)).concat([[...currentHistory]]);
    }
    circleCursor.hidden = true;
    body.style.cursor = 'auto';
    stop()
  }
  
  mouseup = () => {
    isMoving = false;
    ab_x = NaN;
    ab_y = NaN;
    if (isDrawing) {
      index++;
      historyOfMask = (historyOfMask.slice(0,index)).concat([[...currentHistory]]);
    }
    stop()
  }

  generateMask = () => {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    // console.log(imageData,scaledModifiedImageData.data.length);
    const pixelArray = imageData.data;
    
    for (let i = 0; i < pixelArray.length; i += 4) {
      const redValue = pixelArray[i];
      const greenValue = pixelArray[i + 1];
      const blueValue = pixelArray[i + 2];
      
      if (currentHistory[i]) {
        pixelArray[i] = blurredImageData.data[i];
        pixelArray[i + 1] = blurredImageData.data[i + 1];
        pixelArray[i + 2] = blurredImageData.data[i + 2];
        pixelArray[i + 3] = blurredImageData.data[i + 3];
      } else if (redValue == 0 && greenValue == 0 && blueValue == 0) {
        pixelArray[i] = blurredImageData.data[i];
        pixelArray[i + 1] = blurredImageData.data[i + 1];
        pixelArray[i + 2] = blurredImageData.data[i + 2];
        pixelArray[i + 3] = blurredImageData.data[i + 3];
        currentHistory[i] = true;
      } else {
        pixelArray[i] = originalImageData.data[i];
        pixelArray[i + 1] = originalImageData.data[i + 1];
        pixelArray[i + 2] = originalImageData.data[i + 2];
        pixelArray[i + 3] = originalImageData.data[i + 3];
      }
    }
    // console.log(pixelArray);
    // console.log(pixelArray, currentHistory);
  
    const newImageData = new ImageData(pixelArray, canvas.width, canvas.height);
    ctx.putImageData(newImageData, 0, 0);
  }

  combineColors = ([r1, g1, b1, alpha1], [r2, g2, b2, alpha2]) => {
    const alphaBlend = alpha1 + alpha2;
    const redBlend = (r1 * alpha1 + r2 * alpha2) / alphaBlend;
    const greenBlend = (g1 * alpha1 + g2 * alpha2) / alphaBlend;
    const blueBlend = (b1 * alpha1 + b2 * alpha2) / alphaBlend;
    return [redBlend, greenBlend, blueBlend, alphaBlend];
  };

  getBlurredImageData = (originalImageData, overlayColor) => {
    const outputData = [];
    for (let i = 0; i < originalImageData.data.length; i += 4) {
      [outputData[i], outputData[i + 1], outputData[i + 2], outputData[i + 3]] = combineColors([originalImageData.data[i], originalImageData.data[i + 1], originalImageData.data[i + 2], originalImageData.data[i + 3]], overlayColor);
    }

    const output = new ImageData(new Uint8ClampedArray(originalImageData.data), canvas.width, canvas.height);
    output.data.set(outputData);

    return output;
  }

  drawOverlay = (originalImageData, blurredImageData, history) => {
    // console.log(originalImageData, blurredImageData, history);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    // console.log(imageData,scaledModifiedImageData.data.length);
    const pixelArray = imageData.data;
    for (let i = 0; i < pixelArray.length; i += 4) {
      if (history[i]) {
        pixelArray[i] = blurredImageData.data[i];
        pixelArray[i + 1] = blurredImageData.data[i + 1];
        pixelArray[i + 2] = blurredImageData.data[i + 2];
        pixelArray[i + 3] = blurredImageData.data[i + 3];
      } else {
        pixelArray[i] = originalImageData.data[i];
        pixelArray[i + 1] = originalImageData.data[i + 1];
        pixelArray[i + 2] = originalImageData.data[i + 2];
        pixelArray[i + 3] = originalImageData.data[i + 3];
      }
    }
    const newImageData = new ImageData(pixelArray, canvas.width, canvas.height);
    ctx.putImageData(newImageData, 0, 0);
  }

  downloadImageData = (imageData, filename) => {
    // Create a canvas element with the same dimensions as the ImageData
    const canvas = document.createElement('canvas');
    canvas.width = imageData.width;
    canvas.height = imageData.height;
  
    // Draw the ImageData onto the canvas
    const ctx = canvas.getContext('2d');
    ctx.putImageData(imageData, 0, 0);
  
    // Get a data URL for the canvas
    const dataURL = canvas.toDataURL();
  
    // Create a link element that will trigger the download when clicked
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataURL;
  
    // Click the link to start the download
    link.click();
  }

  getMask = () => {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    // console.log(imageData,scaledModifiedImageData.data.length);
    const pixelArray = imageData.data;
    for (let i = 0; i < pixelArray.length; i += 4) {
      if (historyOfMask[index][i]) {
        pixelArray[i] = blurredImageData.data[i];
        pixelArray[i + 1] = blurredImageData.data[i + 1];
        pixelArray[i + 2] = blurredImageData.data[i + 2];
        pixelArray[i + 3] = blurredImageData.data[i + 3];
      } else {
        pixelArray[i] = 255;
        pixelArray[i + 1] = 255;
        pixelArray[i + 2] = 255;
        pixelArray[i + 3] = 255;
      }
    }
    const newImageData = new ImageData(pixelArray, canvas.width, canvas.height);
    ctx.putImageData(newImageData, 0, 0);
  }
}

let newCom = new MaskComponent();
newCom.render();
newCom.addEventListeners();