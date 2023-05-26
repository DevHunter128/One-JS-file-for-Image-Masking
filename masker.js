"use strict";
const componentStyles = `
[hidden] {
        display: none !important;
}
:host {
	background-color: white;
}
:host > * {
	background-color: inherit;
}
`;

function MaskComponent(body) {

	const img = new Image();
	img.crossOrigin = 'anonymous';

	let isDrawing = false;
	let isMoving = false;
	let onCanvas = false;
	let [lastX, lastY] = [null, null];
	let index = 0;
	let scaleFactor = 1;
	let translateX = 0;
	let offsetX = 0;
	let offsetY = 0;
	let scaleF = 0; // initial scale factor
	let historyOfMask = [];
	let currentHistory;
	let originalImageData, blurredImageData, workingImageData;
	let cursorSize = 20;
	let invertDraw = false;

	const canvas = document.createElement('canvas');
	canvas.hidden = true;

	const ctx = canvas.getContext('2d');

	const mainBoard = document.createElement('div');
	mainBoard.appendChild(canvas);

	const resizeCursor = () => {
		cursorSize = ctx.lineWidth * (1 + 0.1 * scaleF);
		circleCursor.style.width = cursorSize+"px";
		circleCursor.style.height = cursorSize+"px";
	}

	const resize = () => {
		scaleFactor = Math.min(window.innerWidth / img.width, (window.innerHeight - 70) / img.height);
		canvas.style.transformOrigin = "top left";
		canvas.style.transform = `scale(${scaleFactor})`;
		translateX = (window.innerWidth - img.width * scaleFactor) / 2;
		canvas.style.position = 'absolute';
		canvas.style.left = `${translateX}px`;
		canvas.style.top = '0';
		resizeCursor();
	}

	const loadImage = () => {
		try {
			coverOfFileChooser.innerText = "Loading...";
			const input = body.querySelector('input[type=file]');

			const reader = new FileReader();

			reader.onload = function(event) {
				img.onload = function() {
					canvas.width = img.width;
					canvas.height = img.height;
					resize();
					scaleF = (scaleFactor-1)/0.1;
					offsetX = translateX;
					offsetY = 0;

					ctx.lineWidth = 20;
					ctx.lineCap = 'round';
					ctx.strokeStyle = '#000';
					ctx.drawImage(img, 0, 0);
					originalImageData = new ImageData(ctx.getImageData(0, 0, canvas.width, canvas.height).data, canvas.width, canvas.height);
					workingImageData = new ImageData(ctx.getImageData(0, 0, canvas.width, canvas.height).data, canvas.width, canvas.height);
					historyOfMask[0] = [];
					currentHistory = [];
					for (let i = 0; i < canvas.height * canvas.width; i++) {
						historyOfMask[0][i] = false;
					}
					currentHistory = [...historyOfMask[0]];
					blurredImageData = getBlurredImageData(ctx.getImageData(0, 0, canvas.width, canvas.height), [255, 239, 0, 100]);

					coverOfFileChooser.hidden = true;
					canvas.hidden = false;
					slider.disabled = false;
					_doB.disabled = false;
					_undoB.disabled = false;
					originalB.disabled = false;
					getMaskB.disabled = false;
					downloadB.disabled = false;
					resizeCursor();
				}
				img.src = event.target.result;
			};

			reader.readAsDataURL(input.files[0]);
		} catch (err) {
			console.log(err);
			coverOfFileChooser.innerText = "Error! Retry!";
		}
	}

	const fileChooser = document.createElement('input');
	fileChooser.hidden = true;
	fileChooser.type = "file";
	fileChooser.accept = "image/*";
	fileChooser.onchange = loadImage;
	mainBoard.appendChild(fileChooser);

	const coverOfFileChooser = document.createElement('div');
	coverOfFileChooser.innerText = "Click here to open an image file";
	coverOfFileChooser.style = "display: inline-block; position: relative; left: 50%; transform: translateX(-50%); padding: 4rem 8rem; border-radius: 1rem; border: solid gray 1px; cursor: pointer;";
	coverOfFileChooser.onclick = () => fileChooser.click();
	coverOfFileChooser.onmouseover = (e) => { e.target.style.backgroundColor = "rgba(255, 239, 0, 0.5)" }
	coverOfFileChooser.onmouseout = (e) => { e.target.style.backgroundColor = null }
	mainBoard.appendChild(coverOfFileChooser);

	const combineColors = ([r1, g1, b1, alpha1], [r2, g2, b2, alpha2]) => {
		const alphaBlend = alpha1 + alpha2;
		const redBlend = (r1 * alpha1 + r2 * alpha2) / alphaBlend;
		const greenBlend = (g1 * alpha1 + g2 * alpha2) / alphaBlend;
		const blueBlend = (b1 * alpha1 + b2 * alpha2) / alphaBlend;
		return [redBlend, greenBlend, blueBlend, alphaBlend];
	};

	const getBlurredImageData = (originalImageData, overlayColor) => {
		const outputData = [];
		for (let i = 0; i < originalImageData.data.length; i += 4) {
			[outputData[i], outputData[i + 1], outputData[i + 2], outputData[i + 3]] = combineColors([originalImageData.data[i], originalImageData.data[i + 1], originalImageData.data[i + 2], originalImageData.data[i + 3]], overlayColor);
		}

		const output = new ImageData(new Uint8ClampedArray(originalImageData.data), canvas.width, canvas.height);
		output.data.set(outputData);

		return output;
	}

	const getMaskImageData = () => {
		const imageData = ctx.createImageData(canvas.width, canvas.height);
		const pixelArray = imageData.data;
		for (let i = 0; i < pixelArray.length; i += 4) {
			pixelArray[i + 3] = historyOfMask[index][i] ? 0 : 255;
		}
		return imageData;
	}

	const drawOverlay = (originalImageData, blurredImageData, history) => {
		if(!history){return}
		const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
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
		workingImageData = new ImageData(pixelArray, canvas.width, canvas.height);
		ctx.putImageData(workingImageData, 0, 0);
	}

	const wheelHandler = (e) => {
		e.preventDefault();

		// get the current mouse position relative to the viewport
		let x = e.clientX;
		let y = e.clientY;

		// adjust the scale factor
		let pscaleF = scaleF;
		scaleF -= e.deltaY * 0.01;
		if (scaleF < -8) {
			scaleF = -8;
		} else if (scaleF > 50) {
			scaleF = 50;
		}

		// calculate new scale and offset
		let oldScale = 1 + 0.1 * pscaleF;
		let newScale = 1 + 0.1 * scaleF;

		if(newScale <= scaleFactor){
			newScale = scaleFactor;
			offsetX = translateX;
			offsetY = 0;
			scaleF = (scaleFactor-1)/0.1;
		} else {
			// calculate the new offsets considering the scaleChange and the mouse position
			let scaleChange = newScale / oldScale;
			offsetX = offsetX*scaleChange + (x - x*scaleChange);
			offsetY = offsetY*scaleChange + (y - y*scaleChange);      
		}
		// adjust the transform-origin and scale of the canvas
		canvas.style.transform = `scale(${newScale})`;
		canvas.style.left = `${offsetX}px`;
		canvas.style.top = `${offsetY}px`;

		// adjust the cursor
		resizeCursor();
	};

	const start = (e) => {
		isDrawing = true;
		isMoving = true;
		let transform = canvas.style.transform.split(', ');
		[lastX, lastY] = [null, null];
		draw(e);
	}

	// function to draw on the canvas
	const draw = (e) => {
		circleCursor.style.top = (e.clientY - cursorSize / 2) + 'px';
		circleCursor.style.left = (e.clientX - cursorSize / 2) + 'px';
		circleCursor.hidden = false;
		body.style.cursor = 'none';
		if (isDrawing){
			if(lastX!==null){
				ctx.beginPath();
				ctx.moveTo(lastX, lastY);
				ctx.lineTo(e.offsetX, e.offsetY);
				ctx.stroke();
			} else {
				ctx.beginPath();
				ctx.arc(e.offsetX, e.offsetY, ctx.lineWidth / 2, 0, Math.PI * 2);
				ctx.fill();
			}
			[lastX, lastY] = [e.offsetX, e.offsetY];
			const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
			const pixelArray = imageData.data;
			const workingImagePixelArray = workingImageData.data;
			for (let i = 0; i < pixelArray.length; i += 4) {
				if (pixelArray[i] === 0 && pixelArray[i + 1] === 0 && pixelArray[i + 2] === 0 && pixelArray[i + 3] === 255) {
					const pixelMasked = !invertDraw;
					currentHistory[i] = pixelMasked;
					if(pixelMasked){
						workingImagePixelArray[i] = blurredImageData.data[i];
						workingImagePixelArray[i + 1] = blurredImageData.data[i + 1];
						workingImagePixelArray[i + 2] = blurredImageData.data[i + 2];
						workingImagePixelArray[i + 3] = blurredImageData.data[i + 3];
					} else {
						workingImagePixelArray[i] = originalImageData.data[i];
						workingImagePixelArray[i + 1] = originalImageData.data[i + 1];
						workingImagePixelArray[i + 2] = originalImageData.data[i + 2];
						workingImagePixelArray[i + 3] = originalImageData.data[i + 3];
					}
				}
			}
			ctx.putImageData(workingImageData, 0, 0);
		}
	}

	canvas.addEventListener("wheel", wheelHandler, { passive: false });
	canvas.addEventListener('mousedown', start);
	canvas.addEventListener('mousemove', draw);
	canvas.addEventListener('mouseout', () => {
                onCanvas = false;
                if (isDrawing) {
                        index++;
                        historyOfMask = (historyOfMask.slice(0,index)).concat([[...currentHistory]]);
                }
                circleCursor.hidden = true;
                body.style.cursor = 'auto';
        });
	canvas.addEventListener('mouseup', () => {
                isMoving = false;
                if (isDrawing) {
                        index++;
                        historyOfMask = (historyOfMask.slice(0,index)).concat([[...currentHistory]]);
                }
                isDrawing = false;
        });
	canvas.addEventListener('mouseenter', (e) => {
		onCanvas = true;
		if (isDrawing) start(e);
	});

	const toolBoard = document.createElement('div');
	toolBoard.style = "width: 100%; display: flex; justify-content: center;";

	const toolkit = document.createElement('div');
	toolkit.style = "border-radius: 3rem; border: solid gray 1px; padding: 0.4rem 24px; bottom: 0.5rem; position: fixed; display: flex; align-items: center; gap: 16px; justify-content: center;";
	toolBoard.appendChild(toolkit);

        const _openB = document.createElement('button');
        _openB.style.width = "2rem";
        _openB.style.height = "2rem";
        _openB.innerHTML = "📂";
        _openB.onclick = () => { fileChooser.click() };
        toolkit.appendChild(_openB);

	const label = document.createElement('label');
	label.for = "slider";
	label.innerText = "Brush";
	toolkit.appendChild(label);

	const slider = document.createElement('input');
	slider.name = "slider";
	slider.type = "range";
	slider.min = 5;
	slider.max = 300;
	slider.step = 1;
	slider.value = 20;
	slider.disabled = true;
	slider.oninput = function () {
		ctx.lineWidth = this.value;
		resizeCursor();
		circleCursor.hidden = false;
		body.style.cursor = 'none';
	}
	slider.addEventListener('mouseup', function () {
		circleCursor.hidden = true;
		body.style.cursor = 'auto';
	});
	toolkit.appendChild(slider);

	const _undoB = document.createElement('button');
	_undoB.style.width = "2rem";
	_undoB.style.height = "2rem";
	_undoB.innerHTML = "↶";
	_undoB.disabled = true;
	_undoB.onclick = () => {
		if (index !== 0) {
			index--;
			currentHistory = [...historyOfMask[index]];
			drawOverlay(originalImageData, blurredImageData, currentHistory);
		}
	};
	toolkit.appendChild(_undoB);

	const _doB = document.createElement('button');
	_doB.style.width = "2rem";
	_doB.style.height = "2rem";
	_doB.innerHTML = "↷";
	_doB.disabled = true;
	_doB.onclick = () => {
		if (index < historyOfMask.length - 1) {
			index++
			currentHistory = [...historyOfMask[index]];
			drawOverlay(originalImageData, blurredImageData, currentHistory);
		};
	};
	toolkit.appendChild(_doB);

	const originalB = document.createElement('button');
	originalB.style.width = "2rem";
	originalB.style.height = "2rem";
	originalB.innerHTML = "👁"
	originalB.disabled = true;
	originalB.addEventListener('mousedown', (e) => {
		drawOverlay(originalImageData, blurredImageData, historyOfMask[0]);
	});
	originalB.addEventListener('mouseup', (e) => {
		drawOverlay(originalImageData, blurredImageData, historyOfMask[index]);
	})
	toolkit.appendChild(originalB);

	const getMaskB = document.createElement('button');
	getMaskB.style.height = "2rem";
	getMaskB.innerHTML = "mask";
	getMaskB.disabled = true;
	getMaskB.addEventListener('mousedown', (e) => {
		ctx.putImageData(getMaskImageData(), 0, 0);
	});
	getMaskB.addEventListener('mouseup', (e) => {
		drawOverlay(originalImageData, blurredImageData, historyOfMask[index]);
	});
	toolkit.appendChild(getMaskB);

	const uploadB = document.createElement('button');
	uploadB.style.width = "2rem";
	uploadB.style.height = "2rem";
	uploadB.innerHTML = "⬆";
	uploadB.disabled = true;
	uploadB.onclick = () => {};
	toolkit.appendChild(uploadB);

	const downloadB = document.createElement('button');
	downloadB.style.width = "2rem";
	downloadB.style.height = "2rem";
	downloadB.innerHTML = "⬇";
	downloadB.disabled = true;
	downloadB.onclick = () => {
		downloadImageData(workingImageData, "new.png");
	};
	toolkit.appendChild(downloadB);


	const circleCursor = document.createElement('div');
	circleCursor.style.pointerEvents = 'none';
	circleCursor.style.position = 'fixed';
	circleCursor.style.width = cursorSize+'px';
	circleCursor.style.height = cursorSize+'px';
	circleCursor.style.borderRadius = '50%';
	circleCursor.style.backgroundColor = 'rgba(255, 239, 0, 0.75)';
	circleCursor.hidden = true;


	const downloadImageData = (imageData, filename) => {
		const canvas = document.createElement('canvas');
		canvas.width = imageData.width;
		canvas.height = imageData.height;
		const ctx = canvas.getContext('2d');
		ctx.putImageData(imageData, 0, 0);
		const dataURL = canvas.toDataURL();
		const link = document.createElement('a');
		link.download = filename;
		link.href = dataURL;
		link.click();
	}

	body.appendChild(mainBoard);
	body.appendChild(toolBoard);
	body.appendChild(circleCursor);
	document.addEventListener("keydown", (e) => {
		if (e.ctrlKey){
			invertDraw = true;
		}
	});
	document.addEventListener("keyup", (e) => {
		if (!e.ctrlKey){
			invertDraw = false;
		}
	});
	window.addEventListener('resize', resize);
}

class Masker extends HTMLElement {
	constructor() {
		super();
		this.attachShadow({ mode: 'open' });
		const style = document.createElement('style')
		style.textContent = componentStyles;
		this.shadowRoot.appendChild(style);
		const div = document.createElement('div');
		this.shadowRoot.appendChild(div);
		div.style.width = '100%';
		div.style.height = '100%';
		div.style.overflow = 'hidden';
		const maskComponent = new MaskComponent(div);
	}
}

customElements.define('image-masker', Masker);

