//Gsap related tasks for all scripts
gsap.registerPlugin(ScrollTrigger);
gsap.config({ nullTargetWarn: false });

//Global screen query
const sizeQuery = window.matchMedia("(min-width: 50rem)");

//This value drives the anim offset of the gradient position
document.documentElement.style.setProperty("--rand-delay", Math.random() * -50 + "s");

//Creates a basic img for code
function createImg(src, alt) {
	const img = document.createElement("img");
	img.src = src;
	img.alt = alt;
	return img;
}

//Cancels the transitions allowing for code to set values
function preventTransition(element) {
	blockTransition(element);
	allowTransition(element);
}
function blockTransition(element) {
	element.classList.add("no-anim");
	//Forces the window to redraw
	element.offsetHeight;
}
function allowTransition(element) {
	element.classList.remove("no-anim");
}

//All of these functions/methods are used to modify text this a way thats animatable

//This is the basic line structure for cloning
const lineTemplate = document.createElement("div");
//These are temp styles to ensure that we minimize the impact of checking offset height
lineTemplate.style.display = "inline-block";
lineTemplate.style.visibility = "hidden";
lineTemplate.style.width = "100%";
lineTemplate.style.position = "absolute";
lineTemplate.appendChild(document.createElement("p"));

function wrapInDiv(element) {
	const container = document.createElement("div");
	//Useful for appear animations
	container.style.overflow = "hidden";
	container.style.width = "100%";
	//Replace the element
	element.parentElement.insertBefore(container, element);
	container.appendChild(element);
	return container;
}
function splitText(textElement) {
	//Cache these values for later use
	const words = textElement.textContent.split(" "), wordsLength = words.length;
	//The line builder creates these lines by making a line one at a time, and if a line wraps, makes a new one
	const linesBuilder = new LinesBuilder(textElement, textElement.parentElement);
	//Add each word to the lines
	for (let i = 0; i < wordsLength; i++) { linesBuilder.append(words[i] + " ") };
	//This makes sure that the lines can finish and returns the elements made as a product
	return linesBuilder.finish();
}
function LinesBuilder(replaceElement, parentElement) {
	//This element will hold the new lines
	const lines = document.createElement("div"), ogWidth = replaceElement.offsetWidth;
	//This object works like a loop, changing its current line every iteration
	let currentLine = new Line(lines), baseHeight = null;
	this.append = function (str) {
		//Then add it to the line
		currentLine.append(str);
		//I put this here because baseHeight requires at least one line with one word
		if (!baseHeight) baseHeight = currentLine.height()
		else if (currentLine.height() > baseHeight) {
			//If the line is broken
			//Revert back to the state before it broke and tie loose ends
			currentLine.finish(true);
			//Use this new line for other words
			currentLine = new Line(lines, str);
		}
	};
	this.finish = function () {
		//Officially add to dom
		if (parentElement) parentElement.replaceChild(lines, replaceElement);
		currentLine.finish();
		//Force width with fixed amount (because it changes for some reason)
		lines.style.width = ogWidth + "px";
		//Returns the lines for use this animation
		return lines.children;
	};
	//It is IMPERITAVE that the lines are added to the dom. While this is worse for performance, it must be done to ensure that we can get the offsetHeight
	if (parentElement) parentElement.appendChild(lines);
}
function Line(lines, str) {
	//Create element and the span (I make a span because it is important for animating seperately for cool overflow hidden affects)
	const line = lines.appendChild(lineTemplate.cloneNode(true)),
		lineSpan = line.firstElementChild;
	//This holds the text last for reverting
	let lastText = "";

	//Line methods
	//Gets the current height
	this.height = () => { return line.clientHeight };
	//Adds text, caches old
	this.append = str => { lastText = lineSpan.textContent; return lineSpan.textContent = lastText + str };
	//Finishes up
	this.finish = revert => {
		//Revert to add line breaking support
		if (revert) lineSpan.textContent = lastText;
		//Remove temp styles
		line.style.display = null;
		line.style.visibility = null;
		line.style.width = null;
		line.style.position = null;
		//This "solidifies" the lines
		line.style.whiteSpace = "nowrap";
		line.style.overflow = "hidden";
	};
	//If there is starter text, apply it
	if (typeof str === "string") this.append(str);
}
function splitTextLetters(textElement) {
	//Good for 3d
	textElement.style.transformStyle = "preserve-3D";
	textElement.style.perspective = "300px";
	textElement.style.display = "block";

	const text = textElement.textContent;
	const letters = text.split("");
	const letterFrag = document.createDocumentFragment();
	letters.forEach(letter => {
		const letterDiv = document.createElement("span");
		letterDiv.textContent = letter;
		letterFrag.appendChild(letterDiv);
	});
	textElement.replaceChild(letterFrag, textElement.firstChild);
	return textElement.children;
}

//Converts rem to pixels with the font size of the document element
function convertRemToPixels(rem) {
	return rem * parseFloat(getComputedStyle(document.documentElement).fontSize);
}

//Retrieves a json file
function readJsonFile(file, callback, progressCallback) {
	const xmlhttp = new XMLHttpRequest();
	xmlhttp.overrideMimeType("application/json");
	xmlhttp.onreadystatechange = function () {
		if (this.readyState === 4 && this.status == "200") callback(JSON.parse(this.responseText))
	};
	xmlhttp.onprogress = progressCallback;
	xmlhttp.onerror = () => { location.reload() };
	xmlhttp.open("GET", file, true);
	xmlhttp.send();
}

//Add global effects (effects that should affect every page)
function addGlobalEffects() {
	//Headings
	gsap.utils.toArray("section:not(.no-script-anim) > h2").forEach(heading => {
		heading = wrapInDiv(heading);
		gsap.from(heading.firstElementChild, {
			yPercent: -100,
			duration: .5,
			ease: "power2.out",
			scrollTrigger: {
				trigger: heading,
				toggleActions: "play none none reset"
			},
			onComplete: () => heading.style.overflow = "visible"
		});
	});

	//Paragraphs
	gsap.utils.toArray("section:not(.no-script-anim) > p").forEach(paragraph => {
		gsap.from(paragraph, {
			xPercent: "random(-100, 100)",
			autoAlpha: 0,
			duration: .5,
			ease: "power2.out",
			scrollTrigger: {
				trigger: paragraph,
				toggleActions: "play none none reset"
			}
		});
	});

	//Dividers
	//Different from the footer divider because it doesnt follow the cursor. Instead it bounces on contact
	gsap.utils.toArray(".only-path").forEach(divider => {
		const path = divider.firstElementChild;

		function bounce(e) {
			const bounds = divider.getBoundingClientRect(),
				x = gsap.utils.mapRange(bounds.left, bounds.right, 0, 100, e.clientX),
				y = 15 + (Math.random() * 2 - 1) * 5;
			gsap.fromTo(path, { attr: { d: `M0,15 Q${x},${y} 100,15` } },
				{ attr: { d: `M0,15 Q${x},15 100,15` }, duration: 1, ease: "elastic.out(1, 0.3)", overwrite: true });
		}

		path.addEventListener("pointerover", bounce);
	});

	//Popups
	const popups = gsap.utils.toArray("button + [class*='popup']");
	document.addEventListener("click", e => {
		popups.forEach(popup => {
			const popupBtn = popup.previousElementSibling;
			if (popupBtn.contains(e.target)) return popup.classList.toggle("expand");
			if (!popup.contains(e.target)) popup.classList.remove("expand");
		});
	});

	//Footer
	new gsap.timeline({ defaults: { ease: "power2.out", duration: 1 }, scrollTrigger: { trigger: "footer", toggleActions: "play none none reset" } })
		.from("footer .divider path", { autoAlpha: 0, scaleX: 0, transformOrigin: "center" })
		.from("footer > *:not(.divider)", { autoAlpha: 0, yPercent: 100, stagger: .25 }, "<.25");
	gsap.utils.toArray("footer .divider").forEach(divider => {
		const path = divider.firstElementChild,
			divided = divider.parentElement,
			pathSetter = new gsap.quickSetter(path, "attr");
		let bounds = undefined;

		divided.addEventListener("mousemove", e => {
			e.preventDefault();
			const x = gsap.utils.mapRange(bounds.left, bounds.right, 0, 100, e.clientX),
				y = gsap.utils.mapRange(bounds.top, bounds.bottom, 0, 30, e.clientY);
			pathSetter({ d: `M0,15 Q${x},${y} 100,15` });
		});
		divided.addEventListener("mouseenter", () => bounds = divider.getBoundingClientRect());
		divided.addEventListener("mouseleave", () => gsap.to(path, { attr: { d: "M0,15 Q50,15 100,15" }, duration: 1, ease: "elastic.out(1, 0.3)", overwrite: true }));
	});
}
window.addEventListener("load", addGlobalEffects)

//Fits a dynamic rectangle inside a constant one
function FitRectInRect(dw, dh, cw, ch) {
	//The constant rect will always habe the same aspect ratio
	//The dynamic rect is the rect that will change sizes constantly
	//Returns the correct scale to multiply by
	return Math.min(dw / cw, dh / ch);
}

function HSV(h, s, v, a) {
	this.h = h;
	this.s = s;
	this.v = v;
	this.a = a === undefined ? 1 : 0;
}
HSV.prototype.toRGB = function () {
	//Formula taken from rapidtables.com
	const rgb = { r: 0, g: 0, b: 0, a: this.a },
		c = this.v * this.s,
		x = c * (1 - Math.abs((this.h / 60) % 2 - 1)),
		m = this.v - c,
		i = Math.floor((this.h === 360 ? 0 : this.h) / 60);

	switch (i) {
		case 0:
			rgb.r = c;
			rgb.g = x;
			rgb.b = 0;
			break;
		case 1:
			rgb.r = x;
			rgb.g = c;
			rgb.b = 0;
			break;
		case 2:
			rgb.r = 0;
			rgb.g = c;
			rgb.b = x;
			break;
		case 3:
			rgb.r = 0;
			rgb.g = x;
			rgb.b = c;
			break;
		case 4:
			rgb.r = x;
			rgb.g = 0;
			rgb.b = c;
			break;
		case 5:
		default:
			rgb.r = c;
			rgb.g = 0;
			rgb.b = x;
			break;
	}
	rgb.r += m;
	rgb.g += m;
	rgb.b += m;
	rgb.r *= 255;
	rgb.g *= 255;
	rgb.b *= 255;
	return rgb;
};
HSV.prototype.toHex = function () {
	//Get rgb vals
	const rgb = this.toRGB();
	return RGBtoHex(rgb.r, rgb.g, rgb.b, rgb.a);
}

function RGBtoHex(r, g, b, a) {
	//Change the rgb values to base 16
	r = Math.round(r).toString(16);
	g = Math.round(g).toString(16);
	b = Math.round(b).toString(16);

	if (r.length == 1) r = "0" + r;
	if (g.length == 1) g = "0" + g;
	if (b.length == 1) b = "0" + b;

	let hexCode = "#" + r + g + b;
	if (a != undefined && a < 1) {
		a = Math.round(a * 255).toString(16);
		if (a.length == 1) a = "0" + a;
		hexCode += a;
	}
	//Append zeroes where nescessary and join together
	return hexCode;
}
function RGBtoHSV(r, g, b, a) {
	//Formula taken from rapidtables.com
	const hsv = { h: 0, s: 0, v: 0, a };
	r /= 255;
	g /= 255;
	b /= 255;
	const cMax = Math.max(r, g, b), cMin = Math.min(r, g, b), delta = cMax - cMin;
	if (delta !== 0) {
		switch (cMax) {
			case r:
				hsv.h = 60 * mod((g - b) / delta, 6);
				break;
			case g:
				hsv.h = 60 * (((b - r) / delta) + 2);
				break;
			case b:
			default:
				hsv.h = 60 * (((r - g) / delta) + 4);
				break;
		}
	} else hsv.h = 0;
	hsv.s = cMax === 0 ? 0 : delta / cMax;
	hsv.v = cMax;
	return hsv;
}
function validateChannel(channel, alphaMode) {
	if (isNaN(channel)) return alphaMode ? 1 : 0;
	if (channel === undefined) return alphaMode ? 1 : 0;
	return gsap.utils.clamp(0, alphaMode ? 1 : 255, channel);
}
function mod(n, m) {
	//Javascript default behavior not mathematically correct
	return ((n % m) + m) % m;
}