import {
    ready,
    newInstance,
    SurfaceViewOptions,
    MiniviewPlugin,
    ActiveFilteringPlugin,
    LassoPlugin
} from "@jsplumbtoolkit/browser-ui"
import {isPort, uuid, Vertex, EVENT_CLICK, SpringLayout, StateMachineConnector, DotEndpoint, ContinuousAnchor, cls} from "@jsplumbtoolkit/core"
import {randomNode} from "@jsplumb/toolkit-demo-support"
import { newInstance as newSyntaxHighlighter } from "@jsplumb/json-syntax-highlighter"

const CLASS_SELECTED_MODE = "selected-mode"
const SELECTOR_SELECTED_MODE = cls(CLASS_SELECTED_MODE)
const CLASS_HIGHLIGHT = "hl"

ready(() =>{

    const toolkit = newInstance({
        beforeConnect:function(source, target) {
            // ignore node->node connections; our UI is not configured to produce them. we could catch it and
            // return false, though, which would ensure that nodes could not be connected programmatically.
            if (isPort(source) && isPort(target)) {

                // cannot create loopback connections
                if (source === target) {
                    return false;
                }

                // cannot connect to Ports on the same Node as the Edge source
                if (source.getParent() === target.getParent()) {
                    return false;
                }

                var sourceData = source.getParent().data,
                    targetData = target.getParent().data;

                // attempt to match animals
                var sourceItem  = sourceData.items[source.id];
                var targetItem  = targetData.items[target.id];
                if (sourceItem.entries && targetItem.entries) {
                    for (var i = 0; i < sourceItem.entries.length; i++) {
                        if (targetItem.entries.indexOf(sourceItem.entries[i]) !== -1) {
                            return true;
                        }
                    }
                }
                return false;
            }
        }
    });

    const mainElement = document.querySelector("#jtk-demo-connectivity"),
        canvasElement = mainElement.querySelector(".jtk-demo-canvas"),
        miniviewElement = mainElement.querySelector(".miniview");

// ----------------------- this code is the random node generator. it's just for this demo --------------------------------------

    const words = [
        "CAT", "DOG", "COW", "HORSE", "DUCK", "HEN"
    ];

    const randomPort = (index:number) => {
        const out = [], map = {};
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
        const groupCount = Math.floor(Math.random() * 3) + 1,
            data:any = {
                id:uuid(),
                items:[]
            };

        for (let i = 0; i < groupCount; i++) {
            data.items.push(randomPort(i));
        }

        return toolkit.addNode(data);
    };


// ---------------------------- / end random node generator ---------------------------------------------

    // initial dataset consists of 5 random nodes.
    const nodeCount = 5;
    for (let i = 0; i < nodeCount;i++) {
        newNode()
    }


    const view:SurfaceViewOptions = {
        nodes: {
            "default": {
                template: "tmplNode"
            }
        },
        edges: {
            "default": {
                connector: { type:StateMachineConnector.type, options:{ curviness: 10 } },
                endpoint: { type:DotEndpoint.type, options:{ radius: 10 } },
                anchor: { type:ContinuousAnchor.type, options:{ faces:["left", "right"]} }
            }
        }
    };

    const renderer = toolkit.render(canvasElement, {
        zoomToFit: true,
        view: view,
        layout: {
            type: "Spring"
        },
        plugins:[
            {
                type:MiniviewPlugin.type,
                options:{
                    container:miniviewElement
                }
            },
            ActiveFilteringPlugin.type,
            LassoPlugin.type
        ],
        lassoFilter: ".controls, .controls *, .miniview, .miniview *",
        events: {
            canvasClick: (eEvent) => {
                toolkit.clearSelection();
            },
            modeChanged: (mode:string) => {
                renderer.jsplumb.removeClass(document.querySelector(SELECTOR_SELECTED_MODE), CLASS_SELECTED_MODE);
                renderer.jsplumb.addClass(document.querySelector("[mode='" + mode + "']"), CLASS_SELECTED_MODE);
            }
        },
        consumeRightClick:false
    });

    //
    // use event delegation to attach event handlers to
    // remove buttons. This callback finds the related Node and
    // then tells the toolkit to delete it.
    //
    renderer.on(canvasElement, EVENT_CLICK, ".delete *", (e:Event) => {
        const info = toolkit.getObjectInfo<Vertex>(e.target || e.srcElement)
        const selection = toolkit.selectDescendants(info.obj, true)
        toolkit.remove(selection)
    })

    //
    // use event delegation to attach event handlers to
    // add buttons. This callback adds an edge from the given node
    // to a newly created node, and then the layout is refreshed.
    //
    renderer.on(canvasElement, EVENT_CLICK, ".add *", (e:Event) => {
        // this helper method can retrieve the associated
        // toolkit information from any DOM element.
        const info = toolkit.getObjectInfo<Vertex>(e.target || e.srcElement);
        // get a random node.
        const n = randomNode(uuid())
        // add the node to the toolkit
        const newNode = toolkit.addNode(n)
        // and add an edge for it from the current node.
        toolkit.addEdge({source: info.obj, target: newNode})
    })

    // pan mode/select mode
    renderer.on(mainElement, EVENT_CLICK, "[mode]",  (e:Event) => {
        const el = (e.target || e.srcElement) as HTMLElement
        renderer.setMode(el.getAttribute("mode"))
    })

    // on home button tap, zoom content to fit.
    renderer.on(mainElement, EVENT_CLICK, "[reset]",  () => {
        toolkit.clearSelection()
        renderer.zoomToFit()
    })

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

    renderer.on(mainElement, EVENT_CLICK, "[add]", () => {
        const node = newNode()
        renderer.zoomToFit()
        flash(renderer.getRenderedElement(node))
    });

    newSyntaxHighlighter(toolkit, ".jtk-demo-dataset", 2);
});