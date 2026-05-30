import React, { useState, useRef, useEffect } from 'react';
import { FiX, FiRotateCw, FiZoomIn, FiZoomOut, FiCheck } from 'react-icons/fi';
import './PhotoEditor.css';

const PhotoEditor = ({ imageFile, onSave, onCancel }) => {
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [cropMode, setCropMode] = useState(false);
  const [cropBox, setCropBox] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [selectedFilter, setSelectedFilter] = useState('none');
  const [aspectRatio, setAspectRatio] = useState(null); // null = free, or ratio like 1, 4/3, 16/9, etc.
  const [lockedAspect, setLockedAspect] = useState(false);

  const filters = {
    none: { brightness: 100, contrast: 100, saturation: 100 },
    warm: { brightness: 110, contrast: 105, saturation: 120 },
    cool: { brightness: 95, contrast: 110, saturation: 110 },
    vintage: { brightness: 105, contrast: 95, saturation: 85 },
    bw: { brightness: 100, contrast: 110, saturation: 0 },
    vivid: { brightness: 100, contrast: 120, saturation: 140 },
  };

  const aspectRatios = [
    { label: 'Free', value: null },
    { label: '1:1', value: 1 },
    { label: '4:3', value: 4 / 3 },
    { label: '16:9', value: 16 / 9 },
    { label: '9:16', value: 9 / 16 },
    { label: '3:2', value: 3 / 2 },
  ];

  // Load image
  useEffect(() => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        imageRef.current = img;
        redrawCanvas();
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(imageFile);
  }, [imageFile]);

  const redrawCanvas = () => {
    if (!canvasRef.current || !imageRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = imageRef.current;

    // Set canvas size
    const canvasSize = 400;
    canvas.width = canvasSize;
    canvas.height = canvasSize;

    // Clear canvas
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Calculate scale to fit image in canvas while maintaining aspect ratio
    const scale = Math.min(canvasSize / img.width, canvasSize / img.height);
    const scaledWidth = img.width * scale;
    const scaledHeight = img.height * scale;

    // Save context state
    ctx.save();

    // Move to center of canvas
    ctx.translate(canvas.width / 2, canvas.height / 2);
    
    // Apply rotation
    ctx.rotate((rotation * Math.PI) / 180);
    
    // Apply zoom
    ctx.scale(zoom, zoom);
    
    // Move back by half the scaled image size to center it
    ctx.translate(-scaledWidth / 2, -scaledHeight / 2);

    // Apply filters
    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;

    // Draw image with proper scaling
    ctx.drawImage(img, 0, 0, scaledWidth, scaledHeight);

    ctx.restore();

    // Draw crop box if in crop mode
    if (cropMode && cropBox.width > 0 && cropBox.height > 0) {
      ctx.strokeStyle = 'rgba(244, 63, 94, 0.8)';
      ctx.lineWidth = 2;
      ctx.strokeRect(cropBox.x, cropBox.y, cropBox.width, cropBox.height);

      // Draw corner handles
      const handleSize = 8;
      ctx.fillStyle = 'rgba(244, 63, 94, 1)';
      ctx.fillRect(cropBox.x - handleSize / 2, cropBox.y - handleSize / 2, handleSize, handleSize);
      ctx.fillRect(cropBox.x + cropBox.width - handleSize / 2, cropBox.y - handleSize / 2, handleSize, handleSize);
      ctx.fillRect(cropBox.x - handleSize / 2, cropBox.y + cropBox.height - handleSize / 2, handleSize, handleSize);
      ctx.fillRect(cropBox.x + cropBox.width - handleSize / 2, cropBox.y + cropBox.height - handleSize / 2, handleSize, handleSize);
    }
  };

  useEffect(() => {
    redrawCanvas();
  }, [zoom, rotation, brightness, contrast, saturation, cropMode, cropBox]);

  const handleCanvasMouseDown = (e) => {
    if (!cropMode) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDragging(true);
    setDragStart({ x, y });
    setCropBox({ x, y, width: 0, height: 0 });
  };

  const handleCanvasMouseMove = (e) => {
    if (!isDragging || !cropMode) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    let width = x - dragStart.x;
    let height = y - dragStart.y;

    // Apply aspect ratio constraint if locked
    if (lockedAspect && aspectRatio) {
      const absWidth = Math.abs(width);
      const absHeight = Math.abs(height);
      
      // Constrain based on which dimension is larger
      if (absWidth / absHeight > aspectRatio) {
        width = height * aspectRatio * (width < 0 ? -1 : 1);
      } else {
        height = width / aspectRatio * (height < 0 ? -1 : 1);
      }
    }

    setCropBox({
      x: dragStart.x,
      y: dragStart.y,
      width: Math.abs(width),
      height: Math.abs(height),
    });
  };

  const handleCanvasMouseUp = () => {
    setIsDragging(false);
  };

  const applyFilter = (filterName) => {
    const filter = filters[filterName];
    setBrightness(filter.brightness);
    setContrast(filter.contrast);
    setSaturation(filter.saturation);
    setSelectedFilter(filterName);
  };

  const handleAspectRatioChange = (ratio) => {
    setAspectRatio(ratio);
    setLockedAspect(ratio !== null);
    
    // Auto-fit crop box to new aspect ratio if in crop mode
    if (cropMode && cropBox.width > 0 && cropBox.height > 0 && ratio) {
      const currentAspect = cropBox.width / cropBox.height;
      let newWidth = cropBox.width;
      let newHeight = cropBox.height;

      if (currentAspect > ratio) {
        newWidth = cropBox.height * ratio;
      } else {
        newHeight = cropBox.width / ratio;
      }

      setCropBox({
        ...cropBox,
        width: newWidth,
        height: newHeight,
      });
    }
  };

  const handleSave = async () => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    canvas.toBlob((blob) => {
      const editedFile = new File([blob], imageFile.name, { type: 'image/jpeg' });
      onSave(editedFile);
    }, 'image/jpeg', 0.95);
  };

  return (
    <div className="photo-editor-modal">
      <div className="photo-editor-container">
        {/* Header */}
        <div className="editor-header">
          <h3>Edit Photo</h3>
          <button className="close-btn" onClick={onCancel} aria-label="Close editor">
            <FiX />
          </button>
        </div>

        {/* Canvas */}
        <div className="editor-canvas-wrapper">
          <canvas
            ref={canvasRef}
            className={`editor-canvas ${cropMode ? 'crop-mode' : ''}`}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={handleCanvasMouseUp}
          />
        </div>

        {/* Filter buttons */}
        <div className="editor-filters">
          {Object.keys(filters).map((filterName) => (
            <button
              key={filterName}
              className={`filter-btn ${selectedFilter === filterName ? 'active' : ''}`}
              onClick={() => applyFilter(filterName)}
            >
              {filterName.charAt(0).toUpperCase() + filterName.slice(1)}
            </button>
          ))}
        </div>

        {/* Controls */}
        <div className="editor-controls">
          {/* Aspect Ratio (shown when in crop mode) */}
          {cropMode && (
            <div className="control-group">
              <label>Aspect Ratio</label>
              <div className="aspect-ratio-buttons">
                {aspectRatios.map((ratio) => (
                  <button
                    key={ratio.label}
                    className={`aspect-btn ${aspectRatio === ratio.value ? 'active' : ''}`}
                    onClick={() => handleAspectRatioChange(ratio.value)}
                    title={ratio.label}
                  >
                    {ratio.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Zoom */}
          <div className="control-group">
            <label>Zoom</label>
            <div className="slider-group">
              <button onClick={() => setZoom(Math.max(0.5, zoom - 0.1))} className="slider-btn">
                <FiZoomOut />
              </button>
              <input
                type="range"
                min="0.5"
                max="3"
                step="0.1"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="slider"
              />
              <button onClick={() => setZoom(Math.min(3, zoom + 0.1))} className="slider-btn">
                <FiZoomIn />
              </button>
              <span className="slider-value">{zoom.toFixed(1)}x</span>
            </div>
          </div>

          {/* Rotation */}
          <div className="control-group">
            <label>Rotate</label>
            <div className="slider-group">
              <button onClick={() => setRotation((rotation - 90) % 360)} className="slider-btn">
                <FiRotateCw style={{ transform: 'scaleX(-1)' }} />
              </button>
              <input
                type="range"
                min="0"
                max="360"
                step="15"
                value={rotation}
                onChange={(e) => setRotation(parseInt(e.target.value))}
                className="slider"
              />
              <button onClick={() => setRotation((rotation + 90) % 360)} className="slider-btn">
                <FiRotateCw />
              </button>
              <span className="slider-value">{rotation}°</span>
            </div>
          </div>

          {/* Brightness */}
          <div className="control-group">
            <label>Brightness</label>
            <div className="slider-group">
              <input
                type="range"
                min="50"
                max="150"
                step="5"
                value={brightness}
                onChange={(e) => setBrightness(parseInt(e.target.value))}
                className="slider"
              />
              <span className="slider-value">{brightness}%</span>
            </div>
          </div>

          {/* Contrast */}
          <div className="control-group">
            <label>Contrast</label>
            <div className="slider-group">
              <input
                type="range"
                min="50"
                max="150"
                step="5"
                value={contrast}
                onChange={(e) => setContrast(parseInt(e.target.value))}
                className="slider"
              />
              <span className="slider-value">{contrast}%</span>
            </div>
          </div>

          {/* Saturation */}
          <div className="control-group">
            <label>Saturation</label>
            <div className="slider-group">
              <input
                type="range"
                min="0"
                max="200"
                step="5"
                value={saturation}
                onChange={(e) => setSaturation(parseInt(e.target.value))}
                className="slider"
              />
              <span className="slider-value">{saturation}%</span>
            </div>
          </div>

          {/* Crop toggle */}
          <div className="control-group">
            <button
              className={`crop-toggle-btn ${cropMode ? 'active' : ''}`}
              onClick={() => setCropMode(!cropMode)}
            >
              {cropMode ? '✓ Crop Mode' : 'Crop'}
            </button>
          </div>
        </div>

        {/* Action buttons */}
        <div className="editor-actions">
          <button className="btn-cancel" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn-save" onClick={handleSave}>
            <FiCheck /> Save & Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default PhotoEditor;
