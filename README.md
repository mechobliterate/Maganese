# Maganese

An interactive 3D illusion experience using face tracking to create off-axis projection effects. Move your head to see images pop out or sink into the screen.

## Features

- Real-time face tracking using MediaPipe
- Two illusion modes: Pop-out (CUBE) and Pit (HOLE)
- Dynamic lighting and shadows
- Customizable frame overlay
- Adjustable sensitivity and depth settings
- Custom image upload support

## Getting Started

1. Open `index.html` in a modern web browser
2. Allow camera access when prompted
3. Use the settings panel to adjust the experience

## Controls

### Object Tab
- **Frame Toggle**: Show/hide window frame overlay
- **Mode**: Switch between CUBE and HOLE illusions
- **Size/Depth Sliders**: Adjust illusion dimensions

### Lighting Tab
- **Light Toggle**: Enable/disable dynamic lighting
- **Intensity**: Adjust light brightness
- **Random Position**: Randomize light placement

### System Tab
- **Face Sensitivity**: Control head movement response
- **Distance**: Adjust virtual camera distance
- **Z Sensitivity**: Control depth perception
- **Calibrate**: Reset center position
- **Change Image**: Upload custom images

## Browser Requirements

- WebGL support
- Camera access
- Modern browser (Chrome, Firefox, Safari, Edge)

## Technologies

- Three.js for 3D rendering
- MediaPipe for face tracking
- Canvas API for frame rendering
