import {
    ready,
    newInstance,
    SurfaceViewOptions,
    MiniviewPlugin,
    ActiveFilteringPlugin,
    LassoPlugin
} from "@jsplumbtoolkit/browser-ui"
import {isPort, uuid, EVENT_CLICK, SpringLayout, StateMachineConnector, DotEndpoint, ContinuousAnchor, cls} from "@jsplumbtoolkit/core"
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
                    return false
                }

                // cannot connect to Ports on the same Node as the Edge source
                if (source.getParent() === target.getParent()) {
                    return false
                }

                const sourceData = source.getParent().data,
                    targetData = target.getParent().data;

                // attempt to match animals
                const sourceItem  = sourceData.items[source.id];
                const targetItem  = targetData.items[target.id];
                if (sourceItem.entries && targetItem.entries) {
                    for (let i = 0; i < sourceItem.entries.length; i++) {
                        if (targetItem.entries.indexOf(sourceItem.entries[i]) !== -1) {
                            return true
                        }
                    }
                }
                return false
            }
        }
    });

    const mainElement = document.querySelector("#jtk-demo-connectivity"),
        canvasElement = mainElement.querySelector(".jtk-demo-canvas"),
        miniviewElement = mainElement.querySelector(".miniview")

// ----------------------- this code is the random node generator. it's just for this demo --------------------------------------

    const words = [ "CAT", "DOG", "COW", "HORSE", "DUCK", "HEN" ]

    const randomPort = (index:number) => {
        const out = [], map = {}
        function _one() {
            let a, done = false
            while (!done) {
                a = words[Math.floor(Math.random() * words.length)]
                done = map[a] !== true
                map[a] = true
            }
            return a
        }
        out.push(_one())
        out.push(_one())
        return { entries:out, index:index }
    };

    const newNode = () => {
        const groupCount = Math.floor(Math.random() * 3) + 1,
            data:any = {
                id:uuid(),
                items:[]
            }

        for (let i = 0; i < groupCount; i++) {
            data.items.push(randomPort(i))
        }

        return toolkit.addNode(data)
    }

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
            type: SpringLayout.type
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
            canvasClick: (e:Event) => {
                toolkit.clearSelection();
            },
            modeChanged: (mode:string) => {
                renderer.jsplumb.removeClass(document.querySelector(SELECTOR_SELECTED_MODE), CLASS_SELECTED_MODE);
                renderer.jsplumb.addClass(document.querySelector("[mode='" + mode + "']"), CLASS_SELECTED_MODE);
            }
        },
        consumeRightClick:false
    })

    // pan mode/select mode
    renderer.on(mainElement, EVENT_CLICK, "[mode]",  (e:Event, el:HTMLElement) => {
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
