//author: silent-sea1119
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
  let historyOfImageData = [];
  let blurredImageData, originalBlurredImageData, scaledModifiedImageData, modifiedImageData;


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
    slider.max = 100;
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
        canvas.style.transform = `matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, ${e.pageX - ab_x - img.width / 2}, ${e.pageY - ab_y - img.height / 2}, 0, 1)`;
      }
    })
    document.addEventListener('mouseup', mouseup);
    document.addEventListener("wheel", (e) => {
      // console.log(e.deltaY * 0.01);
      scaleF -= e.deltaY * 0.01;
      if (scaleF < -5)
        scaleF = -5;
      else if (scaleF > 4)
        scaleF = 4;
      canvas.width = img.width * (1 + 0.1 * scaleF);
      canvas.height = img.height * (1 + 0.1 * scaleF);
      ctx.lineWidth = slider.value * (1 + 0.1 * scaleF);
      ctx.lineCap = 'round';
      circleCursor.style.width = ctx.lineWidth + "px";
      circleCursor.style.height = ctx.lineWidth + "px";
      scaledModifiedImageData = rescaleImageData(new ImageData(new Uint8ClampedArray(historyOfImageData[index].data), historyOfImageData[index].width, historyOfImageData[index].height), (1 + 0.1 * scaleF));
      blurredImageData = rescaleImageData(new ImageData(new Uint8ClampedArray(originalBlurredImageData.data), originalBlurredImageData.width, originalBlurredImageData.height), (1 + 0.1 * scaleF));
      ctx.putImageData(scaledModifiedImageData, 0, 0);
    })

    originalB.addEventListener('mousedown', (e) => {
      canvas.style.border = "solid yellow 1px";
      const tempImageData = rescaleImageData(new ImageData(new Uint8ClampedArray(historyOfImageData[0].data), historyOfImageData[0].width, historyOfImageData[0].height), (1 + 0.1 * scaleF));
      ctx.putImageData(tempImageData, 0, 0);
    });
    originalB.addEventListener('mouseup', (e) => {
      canvas.style.border = "solid black 1px";
      const tempImageData = rescaleImageData(new ImageData(new Uint8ClampedArray(historyOfImageData[index].data), historyOfImageData[index].width, historyOfImageData[index].height), (1 + 0.1 * scaleF));
      ctx.putImageData(tempImageData, 0, 0);
    })

    canvas.addEventListener('mousedown', start);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseout', mouseout);

    slider.oninput = function () {
      ctx.lineWidth = this.value * 2 ** scaleF;;
      const rect = canvas.getBoundingClientRect();
      circleCursor.style.top = (rect.top + rect.width / 2 - ctx.lineWidth / 2) + 'px';
      circleCursor.style.left = (rect.left + rect.height / 2 - ctx.lineWidth / 2) + 'px';
      circleCursor.style.width = ctx.lineWidth + "px";
      circleCursor.style.height = ctx.lineWidth + "px";
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
            scaledModifiedImageData = new ImageData(ctx.getImageData(0, 0, canvas.width, canvas.height).data, canvas.width, canvas.height);
            historyOfImageData[0] = new ImageData(new Uint8ClampedArray(scaledModifiedImageData.data), scaledModifiedImageData.width, scaledModifiedImageData.height);
            originalBlurredImageData = gaussianBlur(ctx.getImageData(0, 0, canvas.width, canvas.height), 10);
            blurredImageData = new ImageData(new Uint8ClampedArray(originalBlurredImageData.data), originalBlurredImageData.width, originalBlurredImageData.height);

            coverOfFileChooser.hidden = true;
            canvas.hidden = false;
            slider.disabled = false;
            _doB.disabled = false;
            _undoB.disabled = false;
            originalB.disabled = false;
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
      scaledModifiedImageData = rescaleImageData(new ImageData(new Uint8ClampedArray(historyOfImageData[index].data), historyOfImageData[index].width, historyOfImageData[index].height), (1 + 0.1 * scaleF));
      ctx.putImageData(scaledModifiedImageData, 0, 0);
    }
  }
  _do = () => {
    if (index < historyOfImageData.length - 1) {
      index++
      scaledModifiedImageData = rescaleImageData(new ImageData(new Uint8ClampedArray(historyOfImageData[index].data), historyOfImageData[index].width, historyOfImageData[index].height), (1 + 0.1 * scaleF));
      ctx.putImageData(scaledModifiedImageData, 0, 0);
    };
  }
  download = () => {
    downloadImageData(scaledModifiedImageData, "new.png")
  }

  rescaleImageData = (imageData, scale) => {
    const scaledData = ctx.createImageData(imageData.width * scale, imageData.height * scale);

    for (let y = 0; y < scaledData.height; y++) {
      for (let x = 0; x < scaledData.width; x++) {
        const sourceX = Math.floor(x / scale);
        const sourceY = Math.floor(y / scale);
        const sourceIndex = (sourceY * imageData.width + sourceX) * 4;
        const targetIndex = (y * scaledData.width + x) * 4;

        for (let i = 0; i < 4; i++) {
          scaledData.data[targetIndex + i] = imageData.data[sourceIndex + i];
        }
      }
    }

    return scaledData;
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
  
    circleCursor.style.top = (e.clientY - ctx.lineWidth / 2) + 'px';
    circleCursor.style.left = (e.clientX - ctx.lineWidth / 2) + 'px';
    circleCursor.style.width = ctx.lineWidth + "px";
    circleCursor.style.height = ctx.lineWidth + "px";
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
      historyOfImageData = historyOfImageData.slice(0,index).concat(rescaleImageData(new ImageData(new Uint8ClampedArray(scaledModifiedImageData.data), scaledModifiedImageData.width, scaledModifiedImageData.height), (1 - 0.1 * scaleF)));
      // console.log(historyOfImageData);
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
      historyOfImageData = historyOfImageData.slice(0,index).concat(rescaleImageData(new ImageData(new Uint8ClampedArray(scaledModifiedImageData.data), scaledModifiedImageData.width, scaledModifiedImageData.height), (1 - 0.1 * scaleF)));
      // console.log(historyOfImageData);
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
      
      if (redValue == 0 && greenValue == 0 && blueValue == 0) {
        pixelArray[i] = blurredImageData.data[i];
        pixelArray[i + 1] = blurredImageData.data[i + 1];
        pixelArray[i + 2] = blurredImageData.data[i + 2];
        pixelArray[i + 3] = blurredImageData.data[i + 3];
      } else {
        pixelArray[i] = scaledModifiedImageData.data[i];
        pixelArray[i + 1] = scaledModifiedImageData.data[i + 1];
        pixelArray[i + 2] = scaledModifiedImageData.data[i + 2];
        pixelArray[i + 3] = scaledModifiedImageData.data[i + 3];
      }
    }
  
    const newImageData = new ImageData(pixelArray, canvas.width, canvas.height);
    scaledModifiedImageData = new ImageData(pixelArray, canvas.width, canvas.height);
    ctx.putImageData(newImageData, 0, 0);
  }

  combineColors = (r1, g1, b1, alpha1, r2, g2, b2, alpha2) => {
    const alphaBlend = alpha1 + (1 - alpha1) * alpha2;
    const redBlend = (r1 * alpha1 + r2 * alpha2 * (1 - alpha1)) / alphaBlend;
    const greenBlend = (g1 * alpha1 + g2 * alpha2 * (1 - alpha1)) / alphaBlend;
    const blueBlend = (b1 * alpha1 + b2 * alpha2 * (1 - alpha1)) / alphaBlend;
    return [redBlend, greenBlend, blueBlend, alphaBlend];
  };

  gaussianBlur = (imageData, radius) => {
    const width = imageData.width;
    const height = imageData.height;
  
    // Convert the one-dimensional pixel data into a two-dimensional array
    const pixels = [];
    for (let i = 0; i < height; i++) {
      pixels[i] = [];
      for (let j = 0; j < width; j++) {
        const idx = (i * width + j) * 4;
        pixels[i][j] = [
          imageData.data[idx],
          imageData.data[idx + 1],
          imageData.data[idx + 2],
          imageData.data[idx + 3]
        ];
      }
    }
  
    // Generate the Gaussian kernel
    const kernelSize = radius * 2 + 1;
    const kernel = generateGaussianKernel(kernelSize, radius);
  
    // Convolve the pixels with the Gaussian kernel
    const convolved = convolve2d(pixels, kernel);
  
    // Convert the convolved pixels back into a one-dimensional array
    const outputData = imageData.data;
    for (let i = 0; i < height; i++) {
      for (let j = 0; j < width; j++) {
        const idx = (i * width + j) * 4;
        outputData[idx] = convolved[i][j][0];
        outputData[idx + 1] = convolved[i][j][1];
        outputData[idx + 2] = convolved[i][j][2];
        outputData[idx + 3] = convolved[i][j][3];
      }
    }
  
    // Create a new ImageData object with the blurred pixel data
    const output = imageData;
    output.data.set(outputData);
  
    return output;
  }
  
  
  generateGaussianKernel = (size, sigma) => {
    const kernel = [];
    const center = Math.floor(size / 2);
    let sum = 0;
  
    for (let i = 0; i < size; i++) {
      kernel[i] = [];
      for (let j = 0; j < size; j++) {
        const x = i - center;
        const y = j - center;
        kernel[i][j] = gaussian(Math.sqrt(x * x + y * y), sigma);
        sum += kernel[i][j];
      }
    }
  
    // Normalize the kernel so that its values add up to 1
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        kernel[i][j] /= sum;
      }
    }
  
    return kernel;
  }
  
  gaussian = (x, sigma) => {
    return Math.exp(-(x * x) / (2 * sigma * sigma)) / (sigma * Math.sqrt(2 * Math.PI));
  }
  
  convolve2d = (image, kernel) => {
    const width = image[0].length;
    const height = image.length;
    const kernelSize = kernel.length;
    const kernelRadius = Math.floor(kernelSize / 2);
    const output = [];
  
    for (let y = 0; y < height; y++) {
      output[y] = [];
      for (let x = 0; x < width; x++) {
        let sum = [0, 0, 0, 0];
        for (let i = -kernelRadius; i <= kernelRadius; i++) {
          for (let j = -kernelRadius; j <= kernelRadius; j++) {
            const kx = kernelRadius - j;
            const ky = kernelRadius - i;
            const pixelX = x + j;
            const pixelY = y + i;
            if (pixelX >= 0 && pixelX < width && pixelY >= 0 && pixelY < height) {
              sum[0] += image[pixelY][pixelX][0] * kernel[ky][kx];
              sum[1] += image[pixelY][pixelX][1] * kernel[ky][kx];
              sum[2] += image[pixelY][pixelX][2] * kernel[ky][kx];
              sum[3] += image[pixelY][pixelX][3] * kernel[ky][kx];
            }
          }
        }
        output[y][x] = sum;
      }
    }
  
    return output;
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
}

let newCom = new MaskComponent();
newCom.render();
newCom.addEventListeners();