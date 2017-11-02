
## workspace
A drawing area that displays and allows editing a graph. A graph consists of nodes,
joined together by links. A link goes between two ports, one on each node.

## dynamics
state:
  DEFAULT
  PANNING   // panning viewport
  LASSOING  // selecting by area
  MOVING    // moving Nodes (and their Ninks)
  JOINING   // joining ports (drawing a new Link)

startMousePosition: x,y where current movement began
startNode/startPort: Port (+Node) where joining began

selectedNodes: set of Nodes currently selected (len=0..N)
selectedLinks: set of Links current selected (len=0/1)

actions:
  drop from palette -> new Node, snap, select

  node:
    down -> select
    ctrl+down -> +select
    double-click -> properties

  port:
    down -> join
    shift+down -> detach + join

  canvas:
    ctrl+down -> begin lasso
    move ->
      PANNING
      LASSOING
      MOVING
      JOINING

  up canvas & lasso => begin lasso

  link:
    down -> select




Actions
copySelection
pasteClipboard()
deleteSelection
editSelection
selectAll
importNodes
zoomIn/zoomOut/zoomZero
toggle-show-grid
undo
toggle-snap-grid
move-selection-[left/right/up-down]
step-selection-[left/right/up-down]
