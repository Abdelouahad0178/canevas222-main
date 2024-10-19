/**
 * script.js
 * Version complète et optimisée pour l'application de dessin.
 */

/**
 * Utility Functions
 */

/**
 * Adds a click event listener to an element by its ID.
 * @param {string} elementId - The ID of the element.
 * @param {Function} callback - The callback function to execute on click.
 */
function addClickListener(elementId, callback) {
    const element = document.getElementById(elementId);
    if (element) {
        element.addEventListener('click', callback);
    } else {
        console.warn(`Element with ID '${elementId}' not found.`);
    }
}

/**
 * Debounces a function by the specified delay.
 * @param {Function} func - The function to debounce.
 * @param {number} delay - The delay in milliseconds.
 * @returns {Function} - The debounced function.
 */
function debounce(func, delay) {
    let debounceTimer;
    return function (...args) {
        const context = this;
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => func.apply(context, args), delay);
    };
}

/**
 * HistoryModule Class
 * Manages the undo and redo functionality for the canvas.
 */
class HistoryModule {
    /**
     * Creates an instance of HistoryModule.
     * @param {fabric.Canvas} canvas - The Fabric.js canvas instance.
     * @param {number} limit - The maximum number of history states to keep.
     */
    constructor(canvas, limit = 50) {
        this.canvas = canvas;
        this.history = [];
        this.currentIndex = -1;
        this.limit = limit;

        // Reference to undo and redo buttons
        this.undoBtn = document.getElementById('annuler-btn');
        this.redoBtn = document.getElementById('rétablir-btn');

        this.updateButtons();
    }

    /**
     * Records the current state of the canvas.
     */
    enregistrerEtat() {
        // Truncate history if we're not at the end
        if (this.currentIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.currentIndex + 1);
        }

        // Add new state
        const canvasState = JSON.stringify(this.canvas.toJSON(['measurementText', 'lengthMeasurementText']));
        this.history.push(canvasState);

        // Enforce history limit
        if (this.history.length > this.limit) {
            this.history.shift();
        } else {
            this.currentIndex++;
        }

        this.updateButtons();
    }

    /**
     * Undoes the last action.
     */
    annuler() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            this.loadState();
            this.updateButtons();
        }
    }

    /**
     * Redoes the previously undone action.
     */
    retablir() {
        if (this.currentIndex < this.history.length - 1) {
            this.currentIndex++;
            this.loadState();
            this.updateButtons();
        }
    }

    /**
     * Loads a specific state of the canvas.
     */
    loadState() {
        const state = this.history[this.currentIndex];
        this.canvas.loadFromJSON(state, () => {
            this.canvas.renderAll();
            // Re-establish associations between shapes and measurement texts
            this.reestablishAssociations();
        });
    }

    /**
     * Updates the state of the undo and redo buttons.
     */
    updateButtons() {
        if (this.undoBtn) {
            this.undoBtn.disabled = this.currentIndex <= 0;
        }
        if (this.redoBtn) {
            this.redoBtn.disabled = this.currentIndex >= this.history.length - 1;
        }
    }

    /**
     * Re-establishes associations between shapes and their measurement texts after loading from JSON.
     */
    reestablishAssociations() {
        this.canvas.getObjects().forEach(obj => {
            if (obj.type === 'rect' || obj.type === 'circle' || obj.type === 'triangle') {
                if (obj.measurementText) {
                    const measurementText = this.canvas.getObjects().find(text => text.id === obj.measurementText.id);
                    if (measurementText) {
                        obj.measurementText = measurementText;
                    }
                }
                if (obj.lengthMeasurementText) {
                    const lengthMeasurementText = this.canvas.getObjects().find(text => text.id === obj.lengthMeasurementText.id);
                    if (lengthMeasurementText) {
                        obj.lengthMeasurementText = lengthMeasurementText;
                    }
                }
            }
        });
    }
}

/**
 * ColorModule Class
 * Manages color selection and application for brushes and shapes.
 */
class ColorModule {
    /**
     * Creates an instance of ColorModule.
     */
    constructor() {
        this.selectedColorBtn = null;
        this.selectedShapeColor = "#000000"; // Default color
        this.colorPicker = document.getElementById('color-picker');
        this.shapeColorPicker = document.getElementById('shape-color-picker');
        this.colorOptions = document.querySelectorAll('.colors .option:not(:last-child)');
    }

    /**
     * Initializes the color module by setting up event listeners.
     */
    init() {
        this.setupCustomColorPicker();
        this.setupShapeColorPicker();
        this.setupColorSelection();
    }

    /**
     * Sets up the custom color picker for brushes.
     */
    setupCustomColorPicker() {
        if (this.colorPicker) {
            this.colorPicker.addEventListener('change', (e) => {
                if (this.selectedColorBtn) {
                    this.selectedColorBtn.classList.remove("selected");
                }
                this.colorPicker.parentElement.style.backgroundColor = e.target.value;
                this.colorPicker.parentElement.classList.add("selected");
                this.selectedColorBtn = this.colorPicker.parentElement;
            });
        } else {
            console.warn("Custom color picker with ID 'color-picker' not found.");
        }
    }

    /**
     * Sets up the shape color picker.
     */
    setupShapeColorPicker() {
        if (this.shapeColorPicker) {
            this.shapeColorPicker.addEventListener('change', (e) => {
                this.selectedShapeColor = e.target.value;
            });
        } else {
            console.warn("Shape color picker with ID 'shape-color-picker' not found.");
        }
    }

    /**
     * Sets up event listeners for color option selection.
     */
    setupColorSelection() {
        this.colorOptions.forEach(option => {
            option.addEventListener('click', () => {
                if (this.selectedColorBtn) {
                    this.selectedColorBtn.classList.remove("selected");
                }
                option.classList.add("selected");
                this.selectedColorBtn = option;
            });
        });
    }

    /**
     * Retrieves the current brush color.
     * @returns {string} - The current brush color in RGB or HEX.
     */
    getBrushColor() {
        if (this.selectedColorBtn && !this.selectedColorBtn.contains(this.colorPicker)) {
            return window.getComputedStyle(this.selectedColorBtn).getPropertyValue("background-color");
        } else if (this.colorPicker) {
            return this.colorPicker.value || "#000000";
        }
        return "#000000"; // Fallback color
    }

    /**
     * Retrieves the current shape color.
     * @returns {string} - The current shape color in HEX.
     */
    getShapeColor() {
        return this.selectedShapeColor;
    }
}

/**
 * BrushModule Class
 * Manages brush and eraser tools on the canvas.
 */
class BrushModule {
    /**
     * Creates an instance of BrushModule.
     * @param {fabric.Canvas} canvas - The Fabric.js canvas instance.
     * @param {ColorModule} colorModule - The ColorModule instance.
     */
    constructor(canvas, colorModule) {
        this.canvas = canvas;
        this.colorModule = colorModule;
        this.sizeSlider = document.querySelector("#size-slider");
        this.brushBtn = document.getElementById('brush');
        this.eraserBtn = document.getElementById('eraser');
    }

    /**
     * Initializes the brush module by setting up event listeners.
     */
    init() {
        this.setupBrush();
        this.setupEraser();
        this.setupSizeSlider();
        this.setupMouseUp();
    }

    /**
     * Sets up the brush tool.
     */
    setupBrush() {
        if (this.brushBtn) {
            this.brushBtn.addEventListener('click', () => {
                this.canvas.isDrawingMode = true;
                this.canvas.selection = false;
                this.canvas.freeDrawingBrush.color = this.colorModule.getBrushColor();
                this.canvas.freeDrawingBrush.width = parseInt(this.sizeSlider.value, 10) || 5;
            });
        } else {
            console.warn("Brush button with ID 'brush' not found.");
        }
    }

    /**
     * Sets up the eraser tool.
     */
    setupEraser() {
        if (this.eraserBtn) {
            this.eraserBtn.addEventListener('click', () => {
                this.canvas.isDrawingMode = true;
                this.canvas.freeDrawingBrush.color = "white";
                this.canvas.freeDrawingBrush.width = parseInt(this.sizeSlider.value, 10) || 5;
            });
        } else {
            console.warn("Eraser button with ID 'eraser' not found.");
        }
    }

    /**
     * Sets up the size slider for brush and eraser tools.
     */
    setupSizeSlider() {
        if (this.sizeSlider) {
            this.sizeSlider.addEventListener('input', (e) => {
                const size = parseInt(e.target.value, 10);
                if (!isNaN(size)) {
                    if (this.canvas.isDrawingMode) {
                        this.canvas.freeDrawingBrush.width = size;
                    }
                }
            });
        } else {
            console.warn("Size slider with ID 'size-slider' not found.");
        }
    }

    /**
     * Disables drawing mode when the mouse is released.
     */
    setupMouseUp() {
        this.canvas.on('mouse:up', () => {
            this.canvas.isDrawingMode = false;
            this.canvas.selection = true;
            this.canvas.freeDrawingBrush.color = this.colorModule.getBrushColor();
            this.canvas.freeDrawingBrush.width = parseInt(this.sizeSlider.value, 10) || 5;
        });
    }
}

/**
 * ShapesModule Class
 * Manages the drawing and manipulation of shapes on the canvas.
 */
class ShapesModule {
    /**
     * Creates an instance of ShapesModule.
     * @param {fabric.Canvas} canvas - The Fabric.js canvas instance.
     * @param {ColorModule} colorModule - The ColorModule instance.
     * @param {HistoryModule} historyModule - The HistoryModule instance.
     */
    constructor(canvas, colorModule, historyModule) {
        this.canvas = canvas;
        this.colorModule = colorModule;
        this.historyModule = historyModule;

        this.pixelsPerCm = 37.7952755906; // Approximation for pixel to cm conversion
        this.drawingMode = null;
        this.currentlyDrawing = false;
        this.tempShape = null;
        this.startX = 0;
        this.startY = 0;

        this.shapeButtons = {
            rectangle: document.getElementById('rectangle'),
            rectangleFixedHeight: document.getElementById('rectangle-fixed-height'),
            circle: document.getElementById('circle'),
            triangle: document.getElementById('triangle')
        };

        this.addTableBtn = document.getElementById('add-table-btn');
    }

    /**
     * Initializes the shapes module by setting up event listeners.
     */
    init() {
        this.setupShapeButtons();
        this.setupAddTable();
        this.setupCanvasEvents();
    }

    /**
     * Sets up event listeners for shape buttons.
     */
    setupShapeButtons() {
        if (this.shapeButtons.rectangle) {
            this.shapeButtons.rectangle.addEventListener('click', () => this.setDrawingMode('rectangle'));
        } else {
            console.warn("Rectangle button with ID 'rectangle' not found.");
        }

        if (this.shapeButtons.rectangleFixedHeight) {
            this.shapeButtons.rectangleFixedHeight.addEventListener('click', () => this.setDrawingMode('rectangle-fixed-height'));
        } else {
            console.warn("Rectangle Fixed Height button with ID 'rectangle-fixed-height' not found.");
        }

        if (this.shapeButtons.circle) {
            this.shapeButtons.circle.addEventListener('click', () => this.addCircle());
        } else {
            console.warn("Circle button with ID 'circle' not found.");
        }

        if (this.shapeButtons.triangle) {
            this.shapeButtons.triangle.addEventListener('click', () => this.addTriangle());
        } else {
            console.warn("Triangle button with ID 'triangle' not found.");
        }
    }

    /**
     * Sets the current drawing mode.
     * @param {string} mode - The drawing mode ('rectangle', 'rectangle-fixed-height', etc.).
     */
    setDrawingMode(mode) {
        this.drawingMode = mode;
        console.log(`Drawing mode set to: ${mode}`);
    }

    /**
     * Sets up canvas event listeners for drawing shapes.
     */
    setupCanvasEvents() {
        this.canvas.on('mouse:down', (opt) => this.onMouseDown(opt));
        this.canvas.on('mouse:move', (opt) => this.onMouseMove(opt));
        this.canvas.on('mouse:up', (opt) => this.onMouseUp(opt));
    }

    /**
     * Handles the mouse down event on the canvas.
     * @param {Object} opt - The event object.
     */
    onMouseDown(opt) {
        if (!this.drawingMode) return;

        const pointer = this.canvas.getPointer(opt.e);
        this.startX = pointer.x;
        this.startY = pointer.y;
        this.currentlyDrawing = true;

        const color = this.colorModule.getShapeColor();
        const fillOption = this.getFillOption();

        if (this.drawingMode === 'rectangle') {
            this.tempShape = new fabric.Rect({
                left: this.startX,
                top: this.startY,
                fill: fillOption === 'filled' ? color : 'transparent',
                stroke: color,
                strokeWidth: 2,
                width: 0,
                height: 0,
                hasControls: true,
                hasBorders: true,
                selectable: true
            });
            this.canvas.add(this.tempShape);

            // Create measurement text
            const measurementText = new fabric.Text('', {
                fontSize: 14,
                fill: 'black',
                selectable: false,
                originX: 'center',
                originY: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.7)',
                stroke: 'black',
                strokeWidth: 0.5
            });
            this.canvas.add(measurementText);
            this.tempShape.measurementText = measurementText;
        } else if (this.drawingMode === 'rectangle-fixed-height') {
            const fixedHeight = 0.3 * this.pixelsPerCm; // 0.3 cm in pixels
            this.tempShape = new fabric.Rect({
                left: this.startX,
                top: this.startY,
                fill: 'transparent',
                stroke: color,
                strokeWidth: 2,
                width: 0,
                height: fixedHeight,
                hasControls: true,
                hasBorders: true,
                selectable: true,
                fixedHeightRectangle: true
            });
            this.canvas.add(this.tempShape);

            // Create length measurement text
            const lengthMeasurementText = new fabric.Text('', {
                fontSize: 14,
                fill: 'black',
                selectable: false,
                originX: 'center',
                originY: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.7)',
                stroke: 'black',
                strokeWidth: 0.5
            });
            this.canvas.add(lengthMeasurementText);
            this.tempShape.lengthMeasurementText = lengthMeasurementText;
        }
    }

    /**
     * Handles the mouse move event on the canvas.
     * @param {Object} opt - The event object.
     */
    onMouseMove(opt) {
        if (!this.currentlyDrawing || !this.tempShape) return;

        const pointer = this.canvas.getPointer(opt.e);
        const width = pointer.x - this.startX;
        const height = pointer.y - this.startY;

        if (this.drawingMode === 'rectangle') {
            this.tempShape.set({ width: width, height: height });
            this.canvas.renderAll();
            this.updateShapeMeasurements(this.tempShape, this.tempShape.measurementText);
        } else if (this.drawingMode === 'rectangle-fixed-height') {
            this.tempShape.set({ width: width });
            this.canvas.renderAll();
            this.updateFixedRectangleMeasurement(this.tempShape, this.tempShape.lengthMeasurementText);
        }
    }

    /**
     * Handles the mouse up event on the canvas.
     * @param {Object} opt - The event object.
     */
    onMouseUp(opt) {
        if (!this.currentlyDrawing) return;
        this.currentlyDrawing = false;
        this.drawingMode = null; // Reset drawing mode

        if (this.tempShape) {
            if (this.tempShape.fixedHeightRectangle) {
                this.addFixedRectangleMeasurementListeners(this.tempShape);
            } else {
                this.addShapeMeasurementListeners(this.tempShape);
            }
            this.historyModule.enregistrerEtat();
            this.tempShape = null;
        }
    }

    /**
     * Retrieves the current fill option for shapes.
     * @returns {string} - 'filled' or 'empty'.
     */
    getFillOption() {
        const filledRadio = document.querySelector('input[name="shape-fill"]:checked');
        if (filledRadio) {
            return filledRadio.value === 'filled' ? 'filled' : 'empty';
        }
        return 'filled'; // Default value
    }

    /**
     * Adds a circle to the canvas.
     */
    addCircle() {
        const color = this.colorModule.getShapeColor();
        const fillOption = this.getFillOption();
        const circle = new fabric.Circle({
            radius: 50,
            left: 150,
            top: 100,
            fill: fillOption === 'filled' ? color : 'transparent',
            stroke: color,
            strokeWidth: 2,
            hasControls: true,
            hasBorders: true,
            selectable: true
        });
        this.canvas.add(circle);
        this.historyModule.enregistrerEtat();
        this.addShapeMeasurements(circle);
    }

    /**
     * Adds a triangle to the canvas.
     */
    addTriangle() {
        const color = this.colorModule.getShapeColor();
        const fillOption = this.getFillOption();
        const triangle = new fabric.Triangle({
            width: 100,
            height: 100,
            left: 150,
            top: 100,
            fill: fillOption === 'filled' ? color : 'transparent',
            stroke: color,
            strokeWidth: 2,
            hasControls: true,
            hasBorders: true,
            selectable: true
        });
        this.canvas.add(triangle);
        this.historyModule.enregistrerEtat();
        this.addShapeMeasurements(triangle);
    }

    /**
     * Adds measurement texts to a shape.
     * @param {fabric.Object} shape - The shape object.
     */
    addShapeMeasurements(shape) {
        // Do not add measurements for fixed height rectangles
        if (shape.fixedHeightRectangle) return;

        const measurementText = new fabric.Text('', {
            fontSize: 14,
            fill: 'black',
            selectable: false,
            originX: 'center',
            originY: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.7)',
            stroke: 'black',
            strokeWidth: 0.5
        });
        this.canvas.add(measurementText);
        this.historyModule.enregistrerEtat();
        this.updateShapeMeasurements(shape, measurementText);

        shape.measurementText = measurementText;

        this.addShapeMeasurementListeners(shape);
    }

    /**
     * Updates the measurement text for a shape.
     * @param {fabric.Object} shape - The shape object.
     * @param {fabric.Text} measurementText - The measurement text object.
     */
    updateShapeMeasurements(shape, measurementText) {
        if (!measurementText) return;

        let measurements = '';
        if (shape.type === 'rect') {
            const width = (shape.getScaledWidth() / this.pixelsPerCm).toFixed(2);
            const height = (shape.getScaledHeight() / this.pixelsPerCm).toFixed(2);
            measurements = `L: ${width} cm, H: ${height} cm`;
        } else if (shape.type === 'circle') {
            const radius = (shape.radius * shape.scaleX / this.pixelsPerCm).toFixed(2);
            const diameter = (2 * shape.radius * shape.scaleX / this.pixelsPerCm).toFixed(2);
            measurements = `R: ${radius} cm, D: ${diameter} cm`;
        } else if (shape.type === 'triangle') {
            const a = (shape.width * shape.scaleX / this.pixelsPerCm).toFixed(2);
            const b = (shape.height * shape.scaleY / this.pixelsPerCm).toFixed(2);
            const c = (Math.sqrt(Math.pow(shape.width, 2) + Math.pow(shape.height, 2)) * shape.scaleX / this.pixelsPerCm).toFixed(2);
            measurements = `Côtés: A: ${a} cm, B: ${b} cm, C: ${c} cm`;
        }
        measurementText.set({
            text: measurements,
            left: shape.left + shape.getScaledWidth() / 2,
            top: shape.top - 20,
            angle: 0 // Keep text horizontal
        });
        this.canvas.bringToFront(measurementText);
        this.canvas.renderAll();
    }

    /**
     * Adds listeners to a fixed height rectangle for updating measurements.
     * @param {fabric.Rect} shape - The fixed height rectangle.
     */
    addFixedRectangleMeasurementListeners(shape) {
        const measurementText = shape.lengthMeasurementText;
        shape.on('modified', () => {
            this.updateFixedRectangleMeasurement(shape, measurementText);
        });
        shape.on('scaling', () => {
            this.updateFixedRectangleMeasurement(shape, measurementText);
        });
        shape.on('moving', () => {
            this.updateFixedRectangleMeasurement(shape, measurementText);
        });
        shape.on('removed', () => {
            this.canvas.remove(measurementText);
        });
    }

    /**
     * Updates the measurement text for a fixed height rectangle.
     * @param {fabric.Rect} shape - The fixed height rectangle.
     * @param {fabric.Text} measurementText - The length measurement text object.
     */
    updateFixedRectangleMeasurement(shape, measurementText) {
        if (!measurementText) return;

        const width = (shape.getScaledWidth() / this.pixelsPerCm).toFixed(2);
        measurementText.set({
            text: `L: ${width} cm`,
            left: shape.left + shape.getScaledWidth() / 2,
            top: shape.top - 20,
            angle: 0 // Keep text horizontal
        });
        this.canvas.bringToFront(measurementText);
        this.canvas.renderAll();
    }

    /**
     * Adds event listeners to a shape for updating measurements on modifications.
     * @param {fabric.Object} shape - The shape object.
     */
    addShapeMeasurementListeners(shape) {
        const measurementText = shape.measurementText;
        shape.on('modified', () => {
            this.updateShapeMeasurements(shape, measurementText);
        });
        shape.on('scaling', () => {
            this.updateShapeMeasurements(shape, measurementText);
        });
        shape.on('moving', () => {
            this.updateShapeMeasurements(shape, measurementText);
        });
        shape.on('removed', () => {
            this.canvas.remove(measurementText);
        });
    }

    /**
     * Sets up the "Add Table" button functionality.
     */
    setupAddTable() {
        if (this.addTableBtn) {
            this.addTableBtn.addEventListener('click', () => {
                const rows = parseInt(prompt("Nombre de lignes ?", "3"), 10);
                const cols = parseInt(prompt("Nombre de colonnes ?", "3"), 10);

                if (!isNaN(rows) && !isNaN(cols) && rows > 0 && cols > 0) {
                    this.addTable(rows, cols);
                } else {
                    alert("Veuillez entrer des valeurs valides pour les lignes et les colonnes.");
                }
            });
        } else {
            console.warn("Add Table button with ID 'add-table-btn' not found.");
        }
    }

    /**
     * Adds a table to the canvas.
     * @param {number} rows - Number of rows.
     * @param {number} cols - Number of columns.
     */
    addTable(rows = 3, cols = 3) {
        const tableGroup = new fabric.Group([], {
            selectable: true,
            hasBorders: true,
            hasControls: true,
            left: 150,
            top: 100
        });

        const cellWidth = 60;
        const cellHeight = 30;

        // Create the table
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                // Create a cell
                const cell = new fabric.Rect({
                    left: col * cellWidth,
                    top: row * cellHeight,
                    width: cellWidth,
                    height: cellHeight,
                    fill: 'transparent',
                    stroke: 'black',
                    strokeWidth: 1,
                    selectable: false
                });

                // Create the cell text
                const cellText = new fabric.Textbox('', {
                    left: col * cellWidth + 5,
                    top: row * cellHeight + 5,
                    fontSize: 12,
                    width: cellWidth - 10,
                    height: cellHeight - 10,
                    selectable: true,
                    editable: true,
                    textAlign: 'center'
                });

                // Add the cell and text to the group
                tableGroup.addWithUpdate(cell);
                tableGroup.addWithUpdate(cellText);
            }
        }

        // Add the table group to the canvas
        this.canvas.add(tableGroup);
        this.canvas.setActiveObject(tableGroup);
        this.canvas.renderAll();
        this.historyModule.enregistrerEtat();
    }
}

/**
 * TextModule Class
 * Manages adding and editing text on the canvas.
 */
class TextModule {
    /**
     * Creates an instance of TextModule.
     * @param {fabric.Canvas} canvas - The Fabric.js canvas instance.
     * @param {HistoryModule} historyModule - The HistoryModule instance.
     */
    constructor(canvas, historyModule) {
        this.canvas = canvas;
        this.historyModule = historyModule;
        this.textPropertiesMenu = document.getElementById('text-properties-menu');

        // Text property controls
        this.fontFamilySelect = document.getElementById('font-family');
        this.fontSizeInput = document.getElementById('font-size');
        this.fontWeightSelect = document.getElementById('font-weight');
        this.textColorInput = document.getElementById('text-color');

        // Currently selected text object
        this.selectedText = null;
    }

    /**
     * Initializes the text module by setting up event listeners.
     */
    init() {
        this.setupAddTextButton();
        this.setupTextSelection();
        this.setupTextProperties();
    }

    /**
     * Sets up the "Add Text" button functionality.
     */
    setupAddTextButton() {
        const addTextBtn = document.getElementById('add-text-btn');
        if (addTextBtn) {
            addTextBtn.addEventListener('click', () => this.addText());
        } else {
            console.warn("Add Text button with ID 'add-text-btn' not found.");
        }
    }

    /**
     * Adds a new text object to the canvas.
     */
    addText() {
        const text = new fabric.IText('Entrez votre texte', {
            left: 150,
            top: 100,
            fontSize: 20,
            fontFamily: 'Arial',
            fill: '#000000',
            editable: true,
            selectable: true
        });
        this.canvas.add(text);
        this.historyModule.enregistrerEtat();
        this.canvas.setActiveObject(text);
        this.canvas.renderAll();
    }

    /**
     * Sets up event listeners for text selection on the canvas.
     */
    setupTextSelection() {
        this.canvas.on('selection:created', (e) => this.handleSelection(e));
        this.canvas.on('selection:updated', (e) => this.handleSelection(e));
        this.canvas.on('selection:cleared', () => this.hideTextPropertiesMenu());
    }

    /**
     * Handles the selection of objects on the canvas.
     * @param {Object} e - The event object.
     */
    handleSelection(e) {
        const selected = e.selected[0];
        if (selected && selected.type === 'i-text') {
            this.selectedText = selected;
            this.showTextPropertiesMenu(selected);
        } else {
            this.selectedText = null;
            this.hideTextPropertiesMenu();
        }
    }

    /**
     * Displays the text properties menu and updates it with the selected text's properties.
     * @param {fabric.IText} text - The selected text object.
     */
    showTextPropertiesMenu(text) {
        if (this.textPropertiesMenu) {
            this.textPropertiesMenu.style.display = 'flex';
            this.updateTextPropertiesMenu(text);
        }
    }

    /**
     * Hides the text properties menu.
     */
    hideTextPropertiesMenu() {
        if (this.textPropertiesMenu) {
            this.textPropertiesMenu.style.display = 'none';
        }
    }

    /**
     * Updates the text properties menu with the selected text's properties.
     * @param {fabric.IText} text - The selected text object.
     */
    updateTextPropertiesMenu(text) {
        if (this.fontFamilySelect && this.fontSizeInput && this.fontWeightSelect && this.textColorInput) {
            this.fontFamilySelect.value = text.fontFamily || 'Arial';
            this.fontSizeInput.value = text.fontSize || 20;
            this.fontWeightSelect.value = text.fontWeight || 'normal';
            this.textColorInput.value = text.fill || '#000000';
        }
    }

    /**
     * Sets up event listeners for text property controls.
     */
    setupTextProperties() {
        if (this.fontFamilySelect) {
            this.fontFamilySelect.addEventListener('change', () => {
                if (this.selectedText) {
                    this.selectedText.set('fontFamily', this.fontFamilySelect.value);
                    this.canvas.renderAll();
                    this.historyModule.enregistrerEtat();
                }
            });
        }

        if (this.fontSizeInput) {
            this.fontSizeInput.addEventListener('input', () => {
                if (this.selectedText) {
                    const size = parseInt(this.fontSizeInput.value, 10);
                    if (!isNaN(size)) {
                        this.selectedText.set('fontSize', size);
                        this.canvas.renderAll();
                        this.historyModule.enregistrerEtat();
                    }
                }
            });
        }

        if (this.fontWeightSelect) {
            this.fontWeightSelect.addEventListener('change', () => {
                if (this.selectedText) {
                    this.selectedText.set('fontWeight', this.fontWeightSelect.value);
                    this.canvas.renderAll();
                    this.historyModule.enregistrerEtat();
                }
            });
        }

        if (this.textColorInput) {
            this.textColorInput.addEventListener('input', () => {
                if (this.selectedText) {
                    this.selectedText.set('fill', this.textColorInput.value);
                    this.canvas.renderAll();
                    this.historyModule.enregistrerEtat();
                }
            });
        }
    }
}

/**
 * CalculatorModule Class
 * Manages the integrated calculator functionality.
 */// Module de Gestion de la Calculatrice Intégrée
class CalculatorModule {
    constructor() {
        this.calculatorCanvas = document.getElementById("calculator-canvas");
        this.canvasCalcDisplay = document.getElementById("canvas-calc-display");
        this.canvasCalcButtons = document.querySelectorAll("#calculator-canvas .calc-btn");
        this.closeCanvasCalculatorBtn = document.getElementById("close-canvas-calculator");
    }

    init() {
        this.setupDrag();
        this.setupButtons();
        this.setupVisibility();
    }

    setupDrag() {
        let isDragging = false;
        let offsetX, offsetY;

        const getPointerPosition = (e) => {
            if (e.touches) {
                return { x: e.touches[0].clientX, y: e.touches[0].clientY };
            } else {
                return { x: e.clientX, y: e.clientY };
            }
        };

        const startDrag = (e) => {
            isDragging = true;
            const pointer = getPointerPosition(e);
            const rect = this.calculatorCanvas.getBoundingClientRect();
            offsetX = pointer.x - rect.left;
            offsetY = pointer.y - rect.top;
            this.calculatorCanvas.style.cursor = 'move';
            e.preventDefault();
        };

        const drag = (e) => {
            if (isDragging) {
                const pointer = getPointerPosition(e);
                // Calculer les nouvelles positions en tenant compte des limites de la fenêtre
                let newLeft = pointer.x - offsetX;
                let newTop = pointer.y - offsetY;

                // Empêcher la calculatrice de sortir de l'écran
                const windowWidth = window.innerWidth;
                const windowHeight = window.innerHeight;
                const calcWidth = this.calculatorCanvas.offsetWidth;
                const calcHeight = this.calculatorCanvas.offsetHeight;

                newLeft = Math.max(0, Math.min(newLeft, windowWidth - calcWidth));
                newTop = Math.max(0, Math.min(newTop, windowHeight - calcHeight));

                this.calculatorCanvas.style.left = `${newLeft}px`;
                this.calculatorCanvas.style.top = `${newTop}px`;
            }
        };

        const stopDrag = () => {
            isDragging = false;
            this.calculatorCanvas.style.cursor = 'default';
        };

        const calculatorHeader = this.calculatorCanvas.querySelector('h3');
        if (calculatorHeader) {
            calculatorHeader.addEventListener('mousedown', startDrag);
            calculatorHeader.addEventListener('touchstart', startDrag);
        } else {
            console.warn("Le titre de la calculatrice est introuvable.");
        }

        document.addEventListener('mousemove', drag);
        document.addEventListener('touchmove', drag);
        document.addEventListener('mouseup', stopDrag);
        document.addEventListener('touchend', stopDrag);
    }

    setupButtons() {
        this.canvasCalcButtons.forEach(button => {
            button.addEventListener("click", () => this.handleCalcButton(button.textContent));
        });

        if (this.closeCanvasCalculatorBtn) {
            this.closeCanvasCalculatorBtn.addEventListener("click", () => this.hideCalculator());
        } else {
            console.warn("Le bouton 'Fermer' de la calculatrice est introuvable.");
        }
    }

    setupVisibility() {
        const showCalculatorBtn = document.getElementById("show-calculator");
        if (showCalculatorBtn) {
            showCalculatorBtn.addEventListener("click", () => this.showCalculator());
        } else {
            console.warn("Le bouton 'Calculatrice' avec l'ID 'show-calculator' est introuvable.");
        }
    }

    handleCalcButton(value) {
        if (value === "C") {
            this.canvasCalcDisplay.value = "";
        } else if (value === "=") {
            try {
                // Utiliser une fonction sécurisée pour évaluer l'expression
                this.canvasCalcDisplay.value = Function('"use strict";return (' + this.canvasCalcDisplay.value + ')')();
            } catch {
                this.canvasCalcDisplay.value = "Erreur";
            }
        } else {
            this.canvasCalcDisplay.value += value;
        }
    }

    showCalculator() {
        if (this.calculatorCanvas) {
            this.calculatorCanvas.style.display = 'block';
            this.calculatorCanvas.style.zIndex = 9999;
            // Positionner la calculatrice au centre si elle n'a pas encore été positionnée
            if (!this.calculatorCanvas.style.left || !this.calculatorCanvas.style.top) {
                const windowWidth = window.innerWidth;
                const windowHeight = window.innerHeight;
                const calcWidth = this.calculatorCanvas.offsetWidth;
                const calcHeight = this.calculatorCanvas.offsetHeight;
                this.calculatorCanvas.style.left = `${(windowWidth - calcWidth) / 2}px`;
                this.calculatorCanvas.style.top = `${(windowHeight - calcHeight) / 2}px`;
            }
        } else {
            console.warn("La calculatrice avec l'ID 'calculator-canvas' est introuvable.");
        }
    }

    hideCalculator() {
        if (this.calculatorCanvas) {
            this.calculatorCanvas.style.display = 'none';
        }
    }
}

/**
 * ImportExportModule Class
 * Manages importing and exporting of canvas content.
 */
class ImportExportModule {
    /**
     * Creates an instance of ImportExportModule.
     * @param {fabric.Canvas} canvas - The Fabric.js canvas instance.
     * @param {HistoryModule} historyModule - The HistoryModule instance.
     */
    constructor(canvas, historyModule) {
        this.canvas = canvas;
        this.historyModule = historyModule;
        this.nomFichierJSON = null;

        // Import and Export elements
        this.saveImgBtn = document.querySelector(".save-img");
        this.uploadImageInput = document.getElementById("upload-image");
        this.saveJSONBtn = document.getElementById("save-json");
        this.loadJSONInput = document.getElementById("load-json");
        this.loadJSONLabel = document.querySelector(".load-json-btn");
        this.deleteObjectBtn = document.getElementById('delete-object');
        this.deleteMeasurementBtn = document.getElementById('delete-measurement-text');
        this.clearCanvasBtn = document.querySelector('.clear-canvas');
    }

    /**
     * Initializes the import/export module by setting up event listeners.
     */
    init() {
        this.setupSaveImage();
        this.setupUploadImage();
        this.setupSaveJSON();
        this.setupLoadJSON();
        this.setupDeleteObject();
        this.setupDeleteMeasurementText();
        this.setupClearCanvas();
    }

    /**
     * Sets up the "Save as Image" functionality.
     */
    setupSaveImage() {
        if (this.saveImgBtn) {
            this.saveImgBtn.addEventListener("click", () => this.saveAsImage());
        } else {
            console.warn("Save Image button with class 'save-img' not found.");
        }
    }

    /**
     * Saves the canvas content as a PNG image.
     */
    saveAsImage() {
        const dataURL = this.canvas.toDataURL({
            format: 'png',
            multiplier: 2
        });
        const link = document.createElement("a");
        link.href = dataURL;
        link.download = `canvas_${Date.now()}.png`;
        link.click();
    }

    /**
     * Sets up the "Upload Image" functionality.
     */
    setupUploadImage() {
        if (this.uploadImageInput) {
            this.uploadImageInput.addEventListener("change", (e) => this.uploadImage(e));
        } else {
            console.warn("Upload Image input with ID 'upload-image' not found.");
        }
    }

    /**
     * Uploads an image to the canvas.
     * @param {Event} e - The change event.
     */
    uploadImage(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            fabric.Image.fromURL(event.target.result, (img) => {
                img.set({
                    left: 150,
                    top: 100,
                    scaleX: 0.5,
                    scaleY: 0.5,
                    selectable: true,
                    hasBorders: true,
                    hasControls: true
                });
                this.canvas.add(img);
                this.canvas.renderAll();
                this.historyModule.enregistrerEtat();
            }, { crossOrigin: 'anonymous' });
        };
        reader.readAsDataURL(file);
    }

    /**
     * Sets up the "Save as JSON" functionality.
     */
    setupSaveJSON() {
        if (this.saveJSONBtn) {
            this.saveJSONBtn.addEventListener("click", () => this.saveAsJSON());
        } else {
            console.warn("Save JSON button with ID 'save-json' not found.");
        }
    }

    /**
     * Saves the canvas content as a JSON file.
     */
    saveAsJSON() {
        const canvasJSON = JSON.stringify(this.canvas.toJSON(['measurementText', 'lengthMeasurementText']));
        const blob = new Blob([canvasJSON], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = this.nomFichierJSON ? this.nomFichierJSON : `canvas_${Date.now()}.json`;
        link.click();

        alert(this.nomFichierJSON ? `Modifications enregistrées dans ${this.nomFichierJSON}` : "Nouveau fichier JSON créé !");
    }

    /**
     * Sets up the "Load JSON" functionality.
     */
    setupLoadJSON() {
        if (this.loadJSONInput && this.loadJSONLabel) {
            this.loadJSONLabel.addEventListener('click', () => this.loadJSONInput.click());
            this.loadJSONInput.addEventListener("change", (e) => this.loadFromJSON(e));
        } else {
            console.warn("Load JSON input or label not found.");
        }
    }

    /**
     * Loads canvas content from a JSON file.
     * @param {Event} e - The change event.
     */
    loadFromJSON(e) {
        const file = e.target.files[0];
        if (!file) return;

        this.nomFichierJSON = file.name;

        const reader = new FileReader();
        reader.onload = (event) => {
            const json = event.target.result;
            this.canvas.loadFromJSON(json, () => {
                this.canvas.renderAll();
                alert("Le canevas a été chargé avec succès !");
                this.historyModule.enregistrerEtat();
            });
        };
        reader.readAsText(file);
    }

    /**
     * Sets up the "Delete Selected Object" functionality.
     */
    setupDeleteObject() {
        if (this.deleteObjectBtn) {
            this.deleteObjectBtn.addEventListener("click", () => this.deleteSelectedObject());
        } else {
            console.warn("Delete Object button with ID 'delete-object' not found.");
        }
    }

    /**
     * Deletes the currently selected object from the canvas.
     */
    deleteSelectedObject() {
        const activeObject = this.canvas.getActiveObject();
        if (activeObject) {
            // Remove associated measurement texts if present
            const associatedText = activeObject.measurementText || activeObject.lengthMeasurementText;
            if (associatedText) {
                this.canvas.remove(associatedText);
            }
            this.canvas.remove(activeObject);
            this.canvas.renderAll();
            this.historyModule.enregistrerEtat();
        } else {
            alert("Aucun objet sélectionné !");
        }
    }

    /**
     * Sets up the "Delete Measurement Text" functionality.
     */
    setupDeleteMeasurementText() {
        if (this.deleteMeasurementBtn) {
            this.deleteMeasurementBtn.addEventListener("click", () => this.deleteMeasurementText());
        } else {
            console.warn("Delete Measurement Text button with ID 'delete-measurement-text' not found.");
        }
    }

    /**
     * Deletes the measurement text associated with the selected object.
     */
    deleteMeasurementText() {
        const activeObject = this.canvas.getActiveObject();
        if (activeObject) {
            const associatedText = activeObject.measurementText || activeObject.lengthMeasurementText;
            if (associatedText) {
                this.canvas.remove(associatedText);
                if (activeObject.measurementText) {
                    delete activeObject.measurementText;
                }
                if (activeObject.lengthMeasurementText) {
                    delete activeObject.lengthMeasurementText;
                }
                this.canvas.renderAll();
                this.historyModule.enregistrerEtat();
            } else {
                alert("Aucun texte de mesure associé à cet objet !");
            }
        } else {
            alert("Aucun objet sélectionné !");
        }
    }

    /**
     * Sets up the "Clear Canvas" functionality.
     */
    setupClearCanvas() {
        if (this.clearCanvasBtn) {
            this.clearCanvasBtn.addEventListener('click', () => {
                if (confirm('Êtes-vous sûr de vouloir effacer le canevas ?')) {
                    this.canvas.clear();
                    // Reset background color if necessary
                    this.canvas.setBackgroundColor('white', this.canvas.renderAll.bind(this.canvas));
                    this.historyModule.enregistrerEtat();
                }
            });
        } else {
            console.warn("Clear Canvas button with class 'clear-canvas' not found.");
        }
    }
}

/**
 * PrintPreviewModule Class
 * Manages the print preview functionality.
 */
class PrintPreviewModule {
    /**
     * Creates an instance of PrintPreviewModule.
     * @param {fabric.Canvas} canvas - The Fabric.js canvas instance.
     */
    constructor(canvas) {
        this.canvas = canvas;
        this.printPreviewBtn = document.getElementById('print-preview-btn');

        // Check if elements exist
        if (this.printPreviewBtn) {
            this.printPreviewModal = document.getElementById('print-preview-modal');
            if (this.printPreviewModal) {
                this.closeModalSpan = this.printPreviewModal.querySelector('.close-modal');
                this.previewImage = document.getElementById('preview-image');
                this.printBtn = document.getElementById('print-btn');
            }
        }
    }

    /**
     * Initializes the print preview module by setting up event listeners.
     */
    init() {
        if (!this.printPreviewBtn || !this.printPreviewModal) {
            console.warn("Required elements for print preview not found.");
            return;
        }
        this.setupPrintPreview();
        this.setupModalClose();
        this.setupPrint();
    }

    /**
     * Sets up the "Print Preview" button functionality.
     */
    setupPrintPreview() {
        this.printPreviewBtn.addEventListener('click', () => this.showPreview());
    }

    /**
     * Displays the print preview modal with the current canvas image.
     */
    showPreview() {
        const dataURL = this.canvas.toDataURL({
            format: 'png',
            multiplier: 2
        });
        if (this.previewImage) {
            this.previewImage.src = dataURL;
            this.printPreviewModal.style.display = 'block';
            this.previewImage.onload = () => {
                this.printPreviewModal.style.display = 'block';
            };
        }
    }

    /**
     * Sets up the functionality to close the modal when clicking the close button or outside the modal.
     */
    setupModalClose() {
        if (this.closeModalSpan) {
            this.closeModalSpan.addEventListener('click', () => this.hidePreview());
        }

        window.addEventListener('click', (event) => {
            if (event.target === this.printPreviewModal) {
                this.hidePreview();
            }
        });

        // Allow closing with the Esc key
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && this.printPreviewModal.style.display === 'block') {
                this.hidePreview();
            }
        });
    }

    /**
     * Hides the print preview modal.
     */
    hidePreview() {
        if (this.printPreviewModal) {
            this.printPreviewModal.style.display = 'none';
        }
    }

    /**
     * Sets up the print button functionality within the modal.
     */
    setupPrint() {
        if (this.printBtn) {
            this.printBtn.addEventListener('click', () => this.printCanvas());
        } else {
            console.warn("Print button with ID 'print-btn' not found.");
        }
    }

    /**
     * Initiates the print dialog with the canvas image.
     */
    printCanvas() {
        if (!this.previewImage) return;

        const dataURL = this.canvas.toDataURL({
            format: 'png',
            multiplier: 2
        });

        const printWindow = window.open('', 'PrintWindow', 'width=800,height=600');
        printWindow.document.write('<html><head><title>Impression du Canevas</title>');
        printWindow.document.write(`
            <style>
                @media print {
                    img {
                        max-width: 100%;
                        height: auto;
                        page-break-inside: avoid;
                    }
                    body {
                        margin: 0;
                    }
                }
            </style>
        `);
        printWindow.document.write('</head><body>');
        printWindow.document.write(`<img src="${dataURL}" alt="Aperçu du Canevas">`);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
    }
}

/**
 * DuplicateModule Class
 * Manages the duplication of objects on the canvas.
 */
class DuplicateModule {
    /**
     * Creates an instance of DuplicateModule.
     * @param {fabric.Canvas} canvas - The Fabric.js canvas instance.
     * @param {HistoryModule} historyModule - The HistoryModule instance.
     */
    constructor(canvas, historyModule) {
        this.canvas = canvas;
        this.historyModule = historyModule;
        this.duplicateBtn = this.createDuplicateButton();
    }

    /**
     * Initializes the duplicate module by setting up event listeners.
     */
    init() {
        this.setupEvents();
    }

    /**
     * Creates the duplicate button and appends it to the body.
     * @returns {HTMLElement} - The duplicate button element.
     */
    createDuplicateButton() {
        const btn = document.createElement('button');
        btn.innerHTML = '+';
        btn.classList.add('duplicate-btn');
        document.body.appendChild(btn);
        btn.style.display = 'none';
        return btn;
    }

    /**
     * Sets up event listeners for duplication and object selection.
     */
    setupEvents() {
        this.duplicateBtn.addEventListener('click', () => this.duplicateObject());

        this.canvas.on('selection:created', () => this.showDuplicateButton());
        this.canvas.on('selection:updated', () => this.showDuplicateButton());
        this.canvas.on('selection:cleared', () => this.hideDuplicateButton());

        // Delete object with the Delete key
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Delete') {
                this.deleteSelectedObject();
            }
        });
    }

    /**
     * Shows the duplicate button near the selected object.
     */
    showDuplicateButton() {
        const activeObject = this.canvas.getActiveObject();
        if (activeObject) {
            // Calculate absolute position
            const canvasRect = this.canvas.upperCanvasEl.getBoundingClientRect();
            const objBoundingRect = activeObject.getBoundingRect();
            const objLeft = objBoundingRect.left + objBoundingRect.width / 2 + canvasRect.left;
            const objTop = objBoundingRect.top - 10 + canvasRect.top; // Adjust as needed

            // Position the button
            this.duplicateBtn.style.left = `${objLeft}px`;
            this.duplicateBtn.style.top = `${objTop}px`;
            this.duplicateBtn.style.display = 'block';
        }
    }

    /**
     * Hides the duplicate button.
     */
    hideDuplicateButton() {
        this.duplicateBtn.style.display = 'none';
    }

    /**
     * Duplicates the selected object on the canvas.
     */
    duplicateObject() {
        const activeObject = this.canvas.getActiveObject();
        if (activeObject) {
            activeObject.clone((clonedObj) => {
                clonedObj.set({
                    left: activeObject.left + 30,
                    top: activeObject.top + 30,
                    evented: true
                });
                this.canvas.add(clonedObj);
                this.canvas.setActiveObject(clonedObj);

                // Clone associated measurement texts
                if (clonedObj.measurementText) {
                    clonedObj.measurementText.clone((clonedText) => {
                        clonedText.set({
                            left: clonedObj.left + clonedObj.getScaledWidth() / 2,
                            top: clonedObj.top - 20,
                            angle: 0
                        });
                        this.canvas.add(clonedText);
                        clonedObj.measurementText = clonedText;
                    });
                }

                if (clonedObj.lengthMeasurementText) {
                    clonedObj.lengthMeasurementText.clone((clonedText) => {
                        clonedText.set({
                            left: clonedObj.left + clonedObj.getScaledWidth() / 2,
                            top: clonedObj.top - 20,
                            angle: 0
                        });
                        this.canvas.add(clonedText);
                        clonedObj.lengthMeasurementText = clonedText;
                    });
                }

                this.canvas.renderAll();
                this.historyModule.enregistrerEtat();
            });
        }
        this.hideDuplicateButton();
    }

    /**
     * Deletes the selected object from the canvas.
     */
    deleteSelectedObject() {
        const activeObject = this.canvas.getActiveObject();
        if (activeObject) {
            const associatedText = activeObject.measurementText || activeObject.lengthMeasurementText;
            if (associatedText) {
                this.canvas.remove(associatedText);
            }
            this.canvas.remove(activeObject);
            this.canvas.renderAll();
            this.historyModule.enregistrerEtat();
        }
    }
}

/**
 * PhotoPaletteModule Class
 * Manages the photo palette and image insertion.
 */
class PhotoPaletteModule {
    /**
     * Creates an instance of PhotoPaletteModule.
     * @param {fabric.Canvas} canvas - The Fabric.js canvas instance.
     * @param {HistoryModule} historyModule - The HistoryModule instance.
     */
    constructor(canvas, historyModule) {
        this.canvas = canvas;
        this.historyModule = historyModule;
        this.photoPaletteModal = document.getElementById('photo-palette-modal');
        this.openPaletteBtn = document.getElementById('open-photo-palette-btn');
        this.closePaletteSpan = this.photoPaletteModal ? this.photoPaletteModal.querySelector('.close-modal') : null;
        this.photoGallery = document.getElementById('photo-gallery');
        this.photoSearchInput = document.getElementById('photo-search');
        this.photos = []; // Array to store loaded photos
    }

    /**
     * Initializes the photo palette module by setting up event listeners and loading photos.
     */
    init() {
        this.setupOpenPalette();
        this.setupClosePalette();
        this.loadPhotos();
        this.setupSearch();
    }

    /**
     * Sets up the "Open Photo Palette" button functionality.
     */
    setupOpenPalette() {
        if (this.openPaletteBtn) {
            this.openPaletteBtn.addEventListener('click', () => {
                this.photoPaletteModal.style.display = 'block';
            });
        } else {
            console.warn("Open Photo Palette button with ID 'open-photo-palette-btn' not found.");
        }
    }

    /**
     * Sets up the functionality to close the photo palette modal.
     */
    setupClosePalette() {
        if (this.closePaletteSpan) {
            this.closePaletteSpan.addEventListener('click', () => {
                this.photoPaletteModal.style.display = 'none';
            });
        } else {
            console.warn("Close button for photo palette modal not found.");
        }

        window.addEventListener('click', (event) => {
            if (event.target === this.photoPaletteModal) {
                this.photoPaletteModal.style.display = 'none';
            }
        });

        // Allow closing with the Esc key
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && this.photoPaletteModal.style.display === 'block') {
                this.photoPaletteModal.style.display = 'none';
            }
        });
    }

    /**
     * Loads photos from a JSON file (`merged.json`).
     */
    async loadPhotos() {
        try {
            const response = await fetch('merged.json'); // Ensure this file exists and is correctly structured
            if (!response.ok) {
                throw new Error('Error loading JSON file');
            }
            const data = await response.json();
            this.photos = data; // Your JSON should be an array of objects with at least the 'src' property
            this.displayPhotos(this.photos);
        } catch (error) {
            console.error('Error:', error);
            alert('Unable to load the photo palette.');
        }
    }

    /**
     * Displays photos in the photo gallery.
     * @param {Array} photos - Array of photo objects.
     */
    displayPhotos(photos) {
        if (!this.photoGallery) {
            console.warn("Photo gallery with ID 'photo-gallery' not found.");
            return;
        }
        this.photoGallery.innerHTML = ''; // Clear the gallery before displaying new photos
        photos.forEach(photo => {
            const img = document.createElement('img');
            img.src = photo.src; // Use 'src' as in your JSON
            img.alt = photo.alt || 'Photo';
            img.title = photo.alt || 'Photo';
            img.style.width = '100px'; // Adjust as needed
            img.style.height = '100px'; // Make square for consistency
            img.style.objectFit = 'cover';
            img.style.margin = '5px';
            img.style.cursor = 'pointer';
            img.addEventListener('click', () => this.addPhotoToCanvas(photo.src));
            this.photoGallery.appendChild(img);
        });
    }

    /**
     * Adds a photo to the canvas.
     * @param {string} src - The source URL of the photo.
     */
    addPhotoToCanvas(src) {
        fabric.Image.fromURL(src, (img) => {
            img.set({
                left: 100,
                top: 100,
                scaleX: 0.5,
                scaleY: 0.5,
                selectable: true,
                hasBorders: true,
                hasControls: true
            });
            this.canvas.add(img);
            this.canvas.renderAll();
            this.historyModule.enregistrerEtat();
            this.photoPaletteModal.style.display = 'none'; // Close the palette after adding
        }, {
            crossOrigin: 'anonymous',
        });
    }

    /**
     * Sets up the search functionality within the photo palette.
     */
    setupSearch() {
        if (this.photoSearchInput) {
            this.photoSearchInput.addEventListener('input', debounce((e) => {
                const query = e.target.value.toLowerCase();
                const filteredPhotos = this.photos.filter(photo => {
                    const altText = (photo.alt || '').toLowerCase();
                    return altText.includes(query);
                });
                this.displayPhotos(filteredPhotos);
            }, 300));
        } else {
            console.warn("Photo search input with ID 'photo-search' not found.");
        }
    }
}

/**
 * TouchModule Class
 * Manages touch gestures on the canvas using Hammer.js.
 */
class TouchModule {
    /**
     * Creates an instance of TouchModule.
     * @param {fabric.Canvas} canvas - The Fabric.js canvas instance.
     * @param {HistoryModule} historyModule - The HistoryModule instance.
     */
    constructor(canvas, historyModule) {
        this.canvas = canvas;
        this.historyModule = historyModule;
        this.hammer = null;
    }

    /**
     * Initializes the touch module by setting up Hammer.js and Fabric.js touch events.
     */
    init() {
        this.initHammer();
        this.setupFabricTouchEvents();
    }

    /**
     * Initializes Hammer.js for pinch gestures.
     */
    initHammer() {
        const canvasElement = this.canvas.upperCanvasEl;

        // Initialize Hammer.js with pinch recognizer
        this.hammer = new Hammer.Manager(canvasElement);
        const pinch = new Hammer.Pinch();
        this.hammer.add([pinch]);

        this.hammer.on('pinchstart pinchmove', (ev) => {
            this.handlePinch(ev);
        });
    }

    /**
     * Handles pinch gestures for zooming the canvas.
     * @param {Object} ev - The Hammer.js event object.
     */
    handlePinch(ev) {
        let newZoom = this.canvas.getZoom() * ev.scale;

        // Limit zoom levels
        newZoom = Math.max(0.5, Math.min(newZoom, 3));

        const center = new fabric.Point(ev.center.x - this.canvas._offset.left, ev.center.y - this.canvas._offset.top);
        this.canvas.zoomToPoint(center, newZoom);
    }

    /**
     * Sets up touch drag (pan) functionality on the canvas.
     */
    setupFabricTouchEvents() {
        // Allow touch scrolling
        this.canvas.allowTouchScrolling = true;

        // Manage panning
        let isPanning = false;
        let lastPosX, lastPosY;

        this.canvas.on('touch:gesture', (opt) => {
            if (opt.e.touches && opt.e.touches.length === 2) {
                // Disable panning during pinch
                isPanning = false;
            }
        });

        this.canvas.on('touch:drag', (opt) => {
            if (opt.e.touches && opt.e.touches.length === 1) {
                const e = opt.e;
                if (isPanning) {
                    const deltaX = e.touches[0].clientX - lastPosX;
                    const deltaY = e.touches[0].clientY - lastPosY;
                    lastPosX = e.touches[0].clientX;
                    lastPosY = e.touches[0].clientY;

                    const vpt = this.canvas.viewportTransform;
                    vpt[4] += deltaX;
                    vpt[5] += deltaY;
                    this.canvas.requestRenderAll();
                } else {
                    isPanning = true;
                    lastPosX = e.touches[0].clientX;
                    lastPosY = e.touches[0].clientY;
                }
            }
        });

        this.canvas.on('touch:dragend', () => {
            isPanning = false;
        });
    }

    /**
     * Cleans up Hammer.js instance when necessary.
     */
    destroyHammer() {
        if (this.hammer) {
            this.hammer.destroy();
            this.hammer = null;
        }
    }
}

/**
 * App Class
 * The main application class that initializes and manages all modules.
 */
class App {
    /**
     * Creates an instance of App.
     * @param {fabric.Canvas} canvas - The Fabric.js canvas instance.
     */
    constructor(canvas) {
        this.canvas = canvas;

        // Initialize modules
        this.historyModule = new HistoryModule(canvas);
        this.colorModule = new ColorModule();
        this.brushModule = new BrushModule(canvas, this.colorModule);
        this.shapesModule = new ShapesModule(canvas, this.colorModule, this.historyModule);
        this.textModule = new TextModule(canvas, this.historyModule);
        this.calculatorModule = new CalculatorModule();
        this.importExportModule = new ImportExportModule(canvas, this.historyModule);
        this.printPreviewModule = new PrintPreviewModule(canvas);
        this.duplicateModule = new DuplicateModule(canvas, this.historyModule);
        this.photoPaletteModule = new PhotoPaletteModule(canvas, this.historyModule);
        this.touchModule = new TouchModule(canvas, this.historyModule);
    }

    /**
     * Initializes the application by initializing all modules and setting up global event listeners.
     */
    init() {
        // Initialize all modules
        this.colorModule.init();
        this.brushModule.init();
        this.shapesModule.init();
        this.textModule.init();
        this.calculatorModule.init();
        this.importExportModule.init();
        this.printPreviewModule.init();
        this.duplicateModule.init();
        this.photoPaletteModule.init();
        this.touchModule.init();

        // Set up undo and redo buttons
        const undoBtn = this.historyModule.undoBtn;
        const redoBtn = this.historyModule.redoBtn;

        if (undoBtn) {
            undoBtn.addEventListener('click', () => this.historyModule.annuler());
        } else {
            console.warn("Undo button with ID 'annuler-btn' not found.");
        }

        if (redoBtn) {
            redoBtn.addEventListener('click', () => this.historyModule.retablir());
        } else {
            console.warn("Redo button with ID 'rétablir-btn' not found.");
        }

        // Set up "Reset View" button if it exists
        const resetViewBtn = document.getElementById('reset-view-btn');
        if (resetViewBtn) {
            resetViewBtn.addEventListener('click', () => this.resetView());
        } else {
            console.warn("Reset View button with ID 'reset-view-btn' not found.");
        }

        // Record the initial state
        this.historyModule.enregistrerEtat();
    }

    /**
     * Resets the canvas view by resetting the viewport transform and zoom.
     */
    resetView() {
        // Reset pan and zoom
        this.canvas.setViewportTransform([1, 0, 0, 1, 0, 0]); // Reset pan
        this.canvas.setZoom(1); // Reset zoom
        this.canvas.requestRenderAll();
    }
}

/**
 * Initialization of the Application Once the DOM is Loaded
 */
document.addEventListener('DOMContentLoaded', () => {
    const drawingBoard = document.querySelector('.drawing-board');
    const canvasElement = document.getElementById('canvas');

    const canvas = new fabric.Canvas('canvas', {
        isDrawingMode: false,
        backgroundColor: 'white',
        allowTouchScrolling: true,
        width: drawingBoard.clientWidth,
        height: 2244 // Height equivalent to 20 A4 pages; consider making this dynamic
    });

    // Adjust canvas width on window resize
    window.addEventListener('resize', () => {
        const newWidth = drawingBoard.clientWidth;
        canvas.setWidth(newWidth);
        canvas.renderAll();
    });

    // Initialize the application
    window.app = new App(canvas);
    app.init();
});
