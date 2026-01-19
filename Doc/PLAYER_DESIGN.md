# Netflix-Style Player Design

## Visual Layout

```
┌─────────────────────────────────────────────────────────────┐
│                                                               │
│                                                               │
│                         VIDEO AREA                            │
│                                                               │
│                           ▶ ◀                                 │
│                    (Large Play Button)                        │
│                     (When Paused)                             │
│                                                               │
│                                                               │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ ═══════════════════════════════════════════════════════ │ │ ← Seek Bar
│  │ ▶  🔊 ━━━  0:45 / 2:30:15          1x  ⛶  ✕            │ │ ← Controls
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Control Bar Breakdown

### Left Section
```
▶  🔊 ━━━  0:45 / 2:30:15
│   │  │        │
│   │  │        └─ Time Display
│   │  └────────── Volume Slider (expands on hover)
│   └───────────── Volume Icon (click to mute)
└───────────────── Play/Pause Button
```

### Right Section
```
1x  ⛶  ✕
│   │   │
│   │   └─ Close Button
│   └───── Fullscreen Toggle
└───────── Playback Speed
```

## Seek Bar States

### Default State
```
Background: ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
Buffered:   ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒░░░░░░░░░░░░░░░░░░░░░░
Played:     ████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
Height:     4px
```

### Hover State
```
Background: ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
Buffered:   ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒░░░░░░░░░░░░░░░░░░░░░░
Played:     ████████●░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
            ↑       ↑
            │       └─ Thumb (visible on hover)
            └───────── Preview: "0:45"
Height:     6px
```

## Color Scheme

### Primary Colors
- **Background**: `#000000` (Pure Black)
- **Netflix Red**: `#e50914`
- **White**: `#ffffff`

### Transparency Layers
- **Control Gradient**: `rgba(0,0,0,0.8)` → `transparent`
- **Button Hover**: `rgba(255,255,255,0.1)`
- **Buffered Bar**: `rgba(255,255,255,0.3)`
- **Seek Bar**: `rgba(255,255,255,0.3)`

### Interactive States
- **Default Opacity**: `0.9`
- **Hover Opacity**: `1.0`
- **Disabled Opacity**: `0.5`

## Animations

### Control Fade
```css
Trigger: Mouse move / Mouse idle
Duration: 300ms
Easing: ease
Property: opacity
```

### Button Hover
```css
Trigger: Mouse hover
Duration: 200ms
Easing: ease
Property: transform (scale 1.15), opacity
```

### Seek Bar Expand
```css
Trigger: Mouse hover on progress bar
Duration: 200ms
Easing: ease
Property: height (4px → 6px)
```

### Volume Slider Expand
```css
Trigger: Mouse hover on volume control
Duration: 200ms
Easing: ease
Property: width (0 → 80px)
```

## Interaction States

### Video States
1. **Loading**
   - Show loading spinner (optional)
   - Controls hidden
   
2. **Paused**
   - Large centered play button visible
   - Controls visible
   - Cursor: pointer
   
3. **Playing**
   - Large play button hidden
   - Controls auto-hide after 2.5s
   - Cursor: none (when controls hidden)
   
4. **Buffering**
   - Show buffering indicator
   - Controls remain visible
   
5. **Error**
   - Show error message
   - Controls hidden

### Control States
1. **Visible**
   - Opacity: 1
   - Pointer events: enabled
   - Cursor: default
   
2. **Hidden**
   - Opacity: 0
   - Pointer events: disabled
   - Cursor: none

## Responsive Breakpoints

### Desktop (> 768px)
- Full control bar
- Volume slider visible
- All buttons shown
- Padding: 40px

### Mobile (≤ 768px)
- Simplified controls
- Volume control hidden
- Larger touch targets
- Padding: 16px

## Accessibility Features

### ARIA Labels
```html
<button aria-label="Play">▶</button>
<button aria-label="Pause">⏸</button>
<button aria-label="Mute">🔊</button>
<button aria-label="Fullscreen">⛶</button>
<input aria-label="Seek video" type="range">
<input aria-label="Volume" type="range">
```

### Focus Indicators
```css
Outline: 2px solid #e50914
Outline-offset: 2px
Border-radius: 4px
```

### Keyboard Navigation
- Tab: Move between controls
- Enter/Space: Activate button
- Arrow keys: Adjust sliders
- Escape: Exit fullscreen

## Performance Optimizations

### GPU Acceleration
```css
will-change: opacity;
transform: translateZ(0);
```

### Prevent Reflow
- Use `transform` instead of `left/top`
- Use `opacity` instead of `visibility`
- Avoid layout-triggering properties

### Efficient Updates
- `requestAnimationFrame` for progress
- `useCallback` for event handlers
- Debounced mouse move events
- Throttled progress updates

## Component Hierarchy

```
PlayerContainer
├── Video Element
│   ├── onClick → togglePlay
│   ├── onDoubleClick → toggleFullscreen
│   └── onContextMenu → preventDownload
│
├── CenterPlayButton (when paused)
│   └── onClick → togglePlay
│
└── Controls (fade in/out)
    ├── ProgressBarContainer
    │   ├── ProgressBar
    │   │   ├── Buffered Layer
    │   │   ├── Played Layer
    │   │   └── SeekBar Input
    │   └── TimePreview (on hover)
    │
    └── ControlsBottom
        ├── LeftControls
        │   ├── PlayButton
        │   ├── VolumeControl
        │   │   ├── MuteButton
        │   │   └── VolumeSlider
        │   └── TimeDisplay
        │
        └── RightControls
            ├── SpeedButton
            ├── FullscreenButton
            └── CloseButton
```

## CSS Architecture

### Module Structure
```
VideoPlayer.module.css
├── Layout (.playerContainer, .video)
├── Center Play Button (.centerPlayButton)
├── Controls Container (.controls)
├── Progress Bar (.progressBar, .buffered, .played)
├── Seek Bar (.seekBar)
├── Control Buttons (.playButton, etc.)
├── Volume Control (.volumeControl, .volumeSlider)
├── Time Display (.time)
├── Responsive (@media queries)
└── Accessibility (focus states)
```

### Naming Convention
- `.playerContainer` - Main container
- `.controls` - Control bar
- `.controlsBottom` - Bottom row
- `.leftControls` - Left section
- `.rightControls` - Right section
- `.playButton` - Specific button
- `.visible` - State modifier

## Browser Compatibility

### Fully Supported
- Chrome 90+ ✅
- Firefox 88+ ✅
- Safari 14+ ✅
- Edge 90+ ✅

### Partial Support
- Chrome 60-89 ⚠️ (no some CSS features)
- Firefox 60-87 ⚠️ (no some CSS features)
- Safari 12-13 ⚠️ (limited fullscreen)

### Not Supported
- IE 11 ❌
- Opera Mini ❌
- Old mobile browsers ❌

## Design Principles

### 1. Minimal & Clean
- No clutter
- Essential controls only
- Hidden by default
- Smooth transitions

### 2. Intuitive
- Standard icons
- Familiar layout
- Predictable behavior
- Clear feedback

### 3. Performant
- 60fps animations
- No jank
- Efficient rendering
- Low CPU usage

### 4. Accessible
- Keyboard navigation
- Screen reader support
- Focus indicators
- ARIA labels

### 5. Responsive
- Works on all screens
- Touch-friendly
- Adaptive layout
- Mobile-optimized
