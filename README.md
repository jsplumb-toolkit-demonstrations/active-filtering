<a name="top"></a>
## Active Filtering

This is a demonstration of the **activeFiltering** option in the Surface widget.

![Active Filtering Demo](demo-active-filtering-app.png)

<a name="package"></a>
### package.json

```javascript
{
    "dependencies": {
        "@jsplumbtoolkit/browser-ui-vanilla": "^5.7.1",
        "@jsplumbtoolkit/layout-force-directed": "^5.7.1",
        "@jsplumbtoolkit/browser-ui-plugin-miniview": "^5.7.1",
        "@jsplumbtoolkit/browser-ui-plugin-lasso": "^5.7.1",
        "@jsplumbtoolkit/browser-ui-plugin-active-filtering": "^5.7.1",
        "@jsplumb/connector-bezier": "^5.7.1"
      }
}

```

[TOP](#top)

---

<a name="templates"></a>
### Templates

This demonstration uses a single template to render its nodes:

```xml
<script type="jtk" id="tmplNode">
    <div class="connectivity-node">
        <h3>${id.substring(0, 5)}</h3>
        <div style="display:flex;flex-direction:column">
            <r-each in="items">
                <div data-jtk-port="${id}" data-jtk-source="true" data-jtk-target="true">
                    <span>${entries.join(' ')}</span>
                </div>
            </r-each>
        </div>
    </div>
</script>
```

[TOP](#top)

---

<a name="toolkit"></a>
### Creating the Toolkit instance

The Toolkit instance is created like this:


```javascript
const toolkit:BrowserUI = newInstance({
    portDataProperty:"items",
    beforeConnect:(source:Vertex, target:Vertex) => {
    
     -- see 'Active Filtering' section below --
     
    }
});

```


[TOP](#top)

---


<a name="loading"></a>
### Data Loading

Nodes for this demonstration consist of a list of Ports, each of which has the name of two animals randomly selected from a list.  The code to generate Nodes is as follows (but note that this code is demo-specific; it exists purely for this demo):


```javascript

import { uuid } from "@jsplumbtoolkit/core"

const words = [
    "CAT", "DOG", "COW", "HORSE", "DUCK", "HEN"
];

const randomPort = (index:number) => {
    let out = [], map = {};
    function _one() {
        let a, done = false;
        while (!done) {
            a = words[Math.floor(Math.random() * words.length)];
            done = map[a] !== true;
            map[a] = true;
        }
        return a;
    }
    out.push(_one());
    out.push(_one());
    return { entries:out, index:index };
};

const newNode = () => {
    var groupCount = Math.floor(Math.random() * 3) + 1,
        data = {
            id:uuid(),
            items:[]
        };

    for (let i = 0; i < groupCount; i++) {
        data.items.push(randomPort(i));
    }

    toolkit.addNode(data);
};
```

The initial dataset is constructed as follows:

```javascript
let nodeCount = 5;
for (let i = 0; i < nodeCount;i++) {
    newNode();
}

```

Subsequently, when the user presses the `+` button, a new Node is added using the `newNode` method, which adds a new node to a random place on the screen.

[TOP](#top)

---

<a name="view"></a>
### View

```javascript

import {StateMachineConnector} from "@jsplumb/connector-bezier"
import { DotEndpoint, AnchorLocations } from "@jsplumbtoolkit/browser-ui-vanilla"

const view:SurfaceViewOptions = {
    nodes: {
        [DEFAULT]: {
            templateId: "tmplNode"
        }
    },
    edges: {
        [DEFAULT]: {
            connector: { type:StateMachineConnector.type, options:{ curviness: 10 } },
            endpoint: { type:DotEndpoint.type, options:{ radius: 10 } },
            anchor: { type:AnchorLocations.Continuous, options:{ faces:["left", "right"]} }
        }
    }
};
```

There is a single Node type ("default") defined, mapped to the template shown above, and a single edge, which contains rendering instructions for the connector, its endpoints, and the type of anchor to use.

[TOP](#top)

---

<a name="rendering"></a>
### Rendering

This is the call that sets up the UI:

```javascript
const renderer:Surface = toolkit.render(canvasElement, {
    zoomToFit: true,
    view: view,
    layout: {
        type: ForceDirectedLayout.type
    },
    plugins:[
        {
            type:MiniviewPlugin.type,
            options:{
                container:miniviewElement
            }
        },
        ActiveFilteringPlugin.type,
        {
            type:LassoPlugin.type,
            options:{lassoFilter: ".controls, .controls *, .miniview, .miniview *"}
        }
    ],
    events: {
        [EVENT_CANVAS_CLICK]: (e:Event) => {
            toolkit.clearSelection()
        },
        [EVENT_SURFACE_MODE_CHANGED]: (mode:string) => {
            renderer.removeClass(document.querySelector(SELECTOR_SELECTED_MODE), CLASS_SELECTED_MODE)
            renderer.addClass(document.querySelector("[mode='" + mode + "']"), CLASS_SELECTED_MODE)
        }
    },
    consumeRightClick:false,
    // disable dragging from anywhere in the individual animal elements (drag can only be done via the header)
    dragOptions:{
        filter:"[data-jtk-port], [data-jtk-port] *"
    }
})
```

The first argument to `render` identifies the element into which you wish the Toolkit to render.

Here's an explanation of what the various parameters mean in the second argument:

- **view**

These are the Node and Edge definitions for this renderer, discussed above.

- **layout**

Parameters for the layout. 

```javascript
{
  type: ForceDirectedLayout.type
}
```


We specify a `ForceDirected` layout (only available from version 5.7.0 onwards. For previous versions, use Spring).

- **plugins**

Various plugins to attach to the Surface - here we add 3:


```javascript
plugins:[
    {
        type:MiniviewPlugin.type,
        options:{
            container:miniviewElement
        }
    },
    ActiveFilteringPlugin.type,
    {
        type:LassoPlugin.type,
        options:{lassoFilter: ".controls, .controls *, .miniview, .miniview *"}
    }
]
```

Note that `ActiveFilteringPlugin` is specified without constructor options but the other two do have constructor options specified. For the `LassoPlugin`, `lassoFilter` is a selector that specifies elements on which a mousedown should not cause the selection lasso to begin. In this demonstration we exclude the buttons in the top left and the miniview.

- **events**

We listen for two events:

  `EVENT_CANVAS_CLICK` - a click somewhere on the widget's whitespace. Then we clear the Toolkit's current selection.
  
  `EVENT_SURFACE_MODE_CHANGED` - Surface's mode has changed (either "select" or "pan"). We update the state of the buttons.

- **zoomToFit**

Instructs the Surface to zoom the contents of the display when it is first rendered so that every Node is visible.


[TOP](#top)

---

<a name="filtering"></a>
### Active Filtering

The `activeFiltering:true` parameter set on the `render` call instructs the Surface to invoke the `beforeConnect` function declared on the Toolkit for every combination of node/port whenever the user starts to drag a new edge. Whenever `beforeConnect` does not return true, the related target is disabled.

#### beforeConnect


```javascript
beforeConnect:(source:Vertex, target:Vertex) => {
    // ignore node->node connections; our UI is not configured to produce them. we could catch it and
    // return false, though, which would ensure that nodes could not be connected programmatically.
    if (isPort(source) && isPort(target)) {

        // cannot create loopback connections
        if (source === target) {
            return false
        }

        // cannot connect to Ports on the same Node as the Edge source
        if (source.getParent() === target.getParent()) {
            return false
        }

        const sourceData = source.data.entries,
            targetData = target.data.entries

        // attempt to match animals
        for (let i = 0; i < sourceData.length; i++) {
            if (targetData.indexOf(sourceData[i]) !== -1) {
                return true
            }
        }
        return false
    }
}

```

#### CSS

In this demonstration, disabled targets are made more transparent and their text color is changed to light grey. This is achieved via a CSS class:

```css
.jtk-target-disabled {
    color:#999;
    opacity:0.3;
    outline:none;
}
```

`jtk-target-disabled` is set on a connection target by jsPlumb whenever the target is disabled.


[TOP](#top)

---

<a name="adding"></a>
### Adding New Nodes

The `+` button in the top left corner can be used to add a new node. Here's the code that sets up the listener and adds the new node:

```javascript
//
// assign a class to a new node which brings the user's attention to it. then a little while later,
// take it off.
//
function flash(el:Element) {
    renderer.addClass(el, CLASS_HIGHLIGHT)
    setTimeout(function() {
        renderer.removeClass(el, CLASS_HIGHLIGHT)
    }, 1950)
}

// on add node button, add a new node, zoom the display, flash the new element.
renderer.on(mainElement, EVENT_CLICK, "[add]", () => {
    const node = newNode()
    renderer.zoomToFit()
    flash(renderer.getRenderedElement(node))
});
```

We add the node to the data model first via the `newNode` function we saw above. Then we instruct the surface to resize so it fits all the content, and then we use `getRenderedElement(node)` on our surface widget to retrieve the DOM element that was rendered for the given node.  We then use a little helper function to draw the user's attention to the new node.

The CSS class is specified like this:

```css
.hl {
    outline:12px solid #ffc06c;
}
```


[TOP](#top)

---

<a name="selecting"></a>
### Selecting Nodes

Lasso selection is enabled by default on the Surface widget. To activate the lasso, click the pencil icon in the toolbar:

![Lasso Select Mode](select-lasso.png)

The code that listens to clicks on this icon is as follows:

```javascript
// pan mode/select mode
renderer.on(mainElement, EVENT_CLICK, "[mode]",  (e:Event, el:HTMLElement) => {
    renderer.setMode(el.getAttribute("mode") as SurfaceMode)
})
```

The tap listener extracts the desired mode from the button that was clicked and sets it on the renderer. This causes a `modeChanged` event to be fired, which is picked up by the `modeChanged` event listener in the View.

Note that here we could have used a `click` listener, but `tap` works better for mobile devices.

##### Lasso Operation

The lasso works in two ways: when you drag from left to right, any node that intersects your lasso will be selected.  When you drag from right to left, only nodes that are enclosed by your lasso will be selected.

##### Exiting Select Mode

The Surface widget automatically exits select mode once the user has selected something. In this application we also listen to clicks on the whitespace in the widget and switch back to pan mode when we detect one. This is the `events` argument to the `render` call:

```javascript
events: {
  [EVENT_CANVAS_CLICK]: function (e) {
    toolkit.clearSelection();
  }
}
```

`clearSelection` clears the current selection and switches back to Pan mode.

[TOP](#top)
