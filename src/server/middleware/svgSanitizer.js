import { DOMParser, XMLSerializer } from 'xmldom';
import { optimize } from "svgo";
import { promises as fs } from 'fs';

// Comprehensive set of safe SVG elements
const allowedElements = new Set([
    // Root element
    'svg',

    // Container elements
    'g', 'defs',

    // Shape elements
    'path', 'rect', 'circle', 'ellipse', 'line', 'polyline', 'polygon',

    // Text elements
    'text', 'tspan',

    // Painting elements
    'clipPath', 'mask', 'pattern',

    // Gradient elements
    'linearGradient', 'radialGradient', 'stop',

    // Animation elements
    'animate', 'animateTransform', 'animateMotion', 'mpath', 'set'  // Added mpath
]);

// Comprehensive set of safe SVG attributes
const allowedAttributes = new Set([
    // Core attributes
    'id', 'class', 'style', 'lang', 'tabindex',

    // Namespace declarations
    'xmlns', 'xmlns:xlink', 'version',

    // Sizing and positioning
    'width', 'height', 'x', 'y', 'x1', 'y1', 'x2', 'y2',
    'viewBox', 'preserveAspectRatio',

    // Presentation attributes
    'fill', 'fill-opacity', 'fill-rule',
    'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin',
    'stroke-opacity', 'stroke-dasharray', 'stroke-dashoffset',
    'opacity', 'transform', 'transform-origin',
    'clip-path', 'clip-rule', 'mask',
    'font-family', 'font-size', 'font-weight', 'font-style',
    'text-anchor', 'dominant-baseline',
    'color', 'visibility', 'display',

    // Shape-specific attributes
    'd', // for path
    'cx', 'cy', 'r', // for circle
    'rx', 'ry', // for ellipse and rect
    'points', // for polyline and polygon
    'dx', 'dy', 'rotate', // for text and tspan
    'textLength', 'lengthAdjust',

    // Gradient attributes
    'gradientUnits', 'gradientTransform',
    'spreadMethod', 'patternUnits', 'patternTransform',
    'offset', 'stop-color', 'stop-opacity',

    // Animation attributes - Expanded
    'attributeName', 'attributeType', 'from', 'to', 'dur',
    'repeatCount', 'repeatDur', 'begin', 'end', 'min', 'max', 'restart',
    'calcMode', 'keyTimes', 'keySplines', 'values', 'by',
    'keyPoints', 'path', 'rotate', 'origin',
    'additive', 'accumulate', 'type', 'href', 'xlink:href',  // Added href for animation references
    'fill', 'fill-opacity', // Animation fill mode
    'keying', 'bandwidth', // Animation timing
    'pacing', 'snap', // Animation control

    // Animation transform specific
    'type', 'from', 'to', 'values', // Transform animation
    'by', 'additive', 'accumulate', // Transform accumulation

    // Animation motion specific
    'path', 'keyPoints', 'rotate', 'origin', // Motion path
    'spacing', 'mpath', // Motion control

    // Clip/mask attributes
    'clipPathUnits', 'maskUnits', 'maskContentUnits'
]);

// Updated prohibited patterns - removed some overly restrictive patterns
const prohibitedPatterns = [
    // Script-based attacks
    /javascript:/i,
    /data:/i,
    /vbscript:/i,
    /<script/i,
    /&#/i,

    // JavaScript functions
    /eval\s*\(/i,
    /Function\s*\(/i,
    /setTimeout\s*\(/i,
    /setInterval\s*\(/i,

    // Network requests
    /fetch\s*\(/i,
    /XMLHttpRequest/i,
    /ajax/i,

    // DOM manipulation
    /querySelector/i,
    /getElementById/i,
    /getElementsBy/i,

    // Event handlers
    /^on[a-z]/i,

    // Resource inclusion
    /\bimport\b/i,
    /\brequire\b/i,
    /\bmodule\b/i,

    // Global objects
    /\bwindow\b/i,
    /\bdocument\b/i,
    /\blocation\b/i,

    // Base64 and data URIs
    /data:text/i,
    /data:application/i
];

class SVGSanitizer {
    static #MAX_SIZE = 5000; // pixels
    static #MAX_FILE_SIZE = 500000; // 500KB

    static #validateSize(doc) {
        const svg = doc.documentElement;
        let width = parseInt(svg.getAttribute('width')) || 0;
        let height = parseInt(svg.getAttribute('height')) || 0;

        if (svg.hasAttribute('viewBox')) {
            const [, , vbWidth, vbHeight] = svg.getAttribute('viewBox')
                .split(/[\s,]+/)
                .map(Number);
            width = width || vbWidth;
            height = height || vbHeight;
        }

        if (!width && !height) {
            svg.setAttribute('width', '300');
            svg.setAttribute('height', '300');
        } else {
            if (width > this.#MAX_SIZE) svg.setAttribute('width', `${this.#MAX_SIZE}`);
            if (height > this.#MAX_SIZE) svg.setAttribute('height', `${this.#MAX_SIZE}`);
        }
    }

    static #sanitizeNode(node) {
        // Handle text nodes and comments
        if (node.nodeType === 3 || node.nodeType === 8) {
            return;
        }

        // Handle element nodes
        if (node.nodeType === 1) {
            const tagName = node.nodeName.toLowerCase();

            // Remove disallowed elements
            if (!allowedElements.has(tagName)) {
                if (node.parentNode) {
                    node.parentNode.removeChild(node);
                }
                return;
            }

            // Create a list of attributes to remove
            const attributesToRemove = [];

            // Safely iterate through attributes
            if (node.attributes) {
                for (let i = 0; i < node.attributes.length; i++) {
                    const attr = node.attributes[i];
                    const attrName = attr.name.toLowerCase();
                    const attrValue = attr.value;

                    // Check if attribute is allowed
                    const isProhibited = prohibitedPatterns.some(pattern =>
                        pattern.test(attrValue)
                    );

                    if (!allowedAttributes.has(attrName) || isProhibited || attrName.startsWith('on')) {
                        attributesToRemove.push(attr.name);
                    }
                }
            }

            // Remove marked attributes
            attributesToRemove.forEach(attrName => {
                node.removeAttribute(attrName);
            });
        }

        // Recursively process child nodes
        if (node.childNodes) {
            const childNodes = Array.from(node.childNodes);
            childNodes.forEach(child => this.#sanitizeNode(child));
        }
    }

    static sanitize(svgContent) {
        if (!svgContent || typeof svgContent !== 'string') {
            throw new Error('Invalid SVG content: content must be a string');
        }

        if (svgContent.length > this.#MAX_FILE_SIZE) {
            throw new Error('SVG file too large');
        }

        const parser = new DOMParser();
        const doc = parser.parseFromString(svgContent, 'image/svg+xml');

        // Check for parsing errors
        const parserErrors = Array.from(doc.getElementsByTagName('parsererror'));
        if (parserErrors.length > 0) {
            throw new Error('Invalid SVG content: parsing failed');
        }

        if (!doc.documentElement || doc.documentElement.nodeName !== 'svg') {
            throw new Error('Invalid SVG content: missing SVG element');
        }

        this.#sanitizeNode(doc.documentElement);
        this.#validateSize(doc);

        const serializer = new XMLSerializer();
        const sanitizedSVG = serializer.serializeToString(doc);

        if (sanitizedSVG.length > this.#MAX_FILE_SIZE) {
            throw new Error('Sanitized SVG too large');
        }

        return sanitizedSVG;
    }
}

const handleSVGUpload = async (file) => {
    try {
        const buffer = await fs.readFile(file.path);
        const content = buffer.toString('utf8');
        return SVGSanitizer.sanitize(content);
    } catch (error) {
        console.error('SVG processing error:', error);
        throw new Error(`SVG sanitization failed: ${error.message}`);
    }
};

const svgUploadMiddleware = async (req, res, next) => {
    try {
        if (!req.file || !req.file.mimetype.includes('svg')) {
            return next();
        }

        const sanitizedSVG = await handleSVGUpload(req.file);
        await fs.writeFile(req.file.path, sanitizedSVG);
        next();
    } catch (error) {
        if (req.file) {
            try {
                await fs.unlink(req.file.path);
            } catch (unlinkError) {
                console.error('Error deleting file:', unlinkError);
            }
        }
        return res.status(400).json({ error: error.message });
    }
};

export { SVGSanitizer, handleSVGUpload, svgUploadMiddleware };