import {DOMParser, XMLSerializer} from 'xmldom';
import {optimize} from "svgo";

// Configuration objects using Sets for efficient lookup
const allowedElements = new Set([
    'svg', 'g', 'path', 'rect', 'circle', 'ellipse', 'line', 'polyline',
    'polygon', 'text', 'animate', 'animateMotion', 'animateTransform',
    'set', 'defs', 'linearGradient', 'radialGradient', 'stop',
    'clipPath', 'mask', 'pattern', 'tspan'
]);

const allowedAttributes = new Set([
    // Core SVG attributes
    'id', 'class', 'width', 'height', 'viewBox', 'fill', 'stroke',
    'stroke-width', 'opacity', 'transform', 'x', 'y', 'cx', 'cy',
    'r', 'rx', 'ry', 'd', 'points', 'offset', 'stop-color',
    'stop-opacity', 'gradient-transform', 'pattern-transform',

    // Animation-specific attributes
    'dur', 'repeatCount', 'begin', 'end', 'from', 'to', 'values',
    'keyTimes', 'keySplines', 'attributeName', 'attributeType',
    'calcMode', 'path', 'keyPoints', 'rotate', 'additive',
    'accumulate', 'type', 'restart'
]);

const prohibitedPatterns = [
    /javascript:/i,
    /data:/i,
    /vbscript:/i,
    /&#/i,
    /alert\s*\(/i,
    /eval\s*\(/i,
    /Function\s*\(/i,
    /setTimeout\s*\(/i,
    /setInterval\s*\(/i,
    /fetch\s*\(/i,
    /XMLHttpRequest/i,
    /querySelector/i
];

class SVGSanitizer {
    static #MAX_SIZE = 5000; // pixels
    static #MAX_FILE_SIZE = 500000; // 500KB

    /**
     * Validates and adjusts SVG dimensions
     * @param {Document} doc - The SVG document
     * @throws {Error} If dimensions are invalid
     */
    static #validateSize = (doc) => {
        const svg = doc.documentElement;

        // Parse dimensions, defaulting to 0 if not present
        let width = parseInt(svg.getAttribute('width')) || 0;
        let height = parseInt(svg.getAttribute('height')) || 0;

        // Check viewBox dimensions if present
        if (svg.hasAttribute('viewBox')) {
            const [, , vbWidth, vbHeight] = svg.getAttribute('viewBox')
                .split(' ')
                .map(Number);
            width ||= vbWidth;
            height ||= vbHeight;
        }

        // Apply default or clamp dimensions
        if (!width && !height) {
            svg.setAttribute('width', '300');
            svg.setAttribute('height', '300');
        } else {
            if (width > this.#MAX_SIZE) svg.setAttribute('width', `${this.#MAX_SIZE}`);
            if (height > this.#MAX_SIZE) svg.setAttribute('height', `${this.#MAX_SIZE}`);
        }
    };

    /**
     * Sanitizes a single node in the SVG
     * @param {Node} node - The node to sanitize
     */
    static #sanitizeNode = (node) => {
        // Remove comment nodes
        if (node.nodeType === 8) {
            node.parentNode.removeChild(node);
            return;
        }

        // Process element nodes
        if (node.nodeType === 1) {
            const tagName = node.tagName.toLowerCase();

            // Remove disallowed elements
            if (!allowedElements.has(tagName)) {
                node.parentNode.removeChild(node);
                return;
            }

            // Process attributes
            const attributes = Array.from(node.attributes);

            // Remove all existing attributes
            attributes.forEach(({ name, value }) => {
                const attrName = name.toLowerCase();

                // Remove if not allowed or contains prohibited patterns
                const hasProhibitedPattern = prohibitedPatterns.some(pattern =>
                    pattern.test(value)
                );

                if (!allowedAttributes.has(attrName) || hasProhibitedPattern) {
                    node.removeAttribute(name);
                }
            });

            // Remove all event handlers
            attributes
                .filter(({ name }) => name.toLowerCase().startsWith('on'))
                .forEach(({ name }) => node.removeAttribute(name));
        }

        // Recursively process children
        Array.from(node.childNodes).forEach(child => this.#sanitizeNode(child));
    };

    /**
     * Sanitizes SVG content
     * @param {string} svgContent - The SVG content to sanitize
     * @returns {string} Sanitized SVG content
     * @throws {Error} If SVG is invalid or too large
     */
    static sanitize = (svgContent) => {
        if (svgContent.length > this.#MAX_FILE_SIZE) {
            throw new Error('SVG file too large');
        }

        const parser = new DOMParser();
        const doc = parser.parseFromString(svgContent, 'image/svg+xml');

        // Validate the parsed document
        if (!doc.documentElement) {
            throw new Error('Invalid SVG content');
        }

        this.#sanitizeNode(doc.documentElement);
        this.#validateSize(doc);

        const serializer = new XMLSerializer();
        const sanitizedSVG = serializer.serializeToString(doc);

        if (sanitizedSVG.length > this.#MAX_FILE_SIZE) {
            throw new Error('Sanitized SVG too large');
        }

        return sanitizedSVG;
    };
}

const handleSVGUpload = async (file) => {
    try {
        const content = await file.text();
        return SVGSanitizer.sanitize(content);
    } catch (error) {
        throw new Error(`SVG sanitization failed: ${error.message}`);
    }
};

const svgUploadMiddleware = async (req, res, next) => {
    console.log(req.file);
    return next();
    try {
        if (!req.files?.svg) {
            throw new Error('No SVG file provided');
        }

        const sanitizedSVG = await handleSVGUpload(req.files.svg);

        req.sanitizedSVG = sanitizedSVG;
        next();
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

async function svgSanitize(file) {
    try {
        if (!file.mimetype.includes('image/svg')) {
            throw new Error('No SVG file provided');
        }

        return await optimize(await handleSVGUpload(file));
    } catch (error) {

    }
}

export { SVGSanitizer, handleSVGUpload, svgUploadMiddleware, svgSanitize };