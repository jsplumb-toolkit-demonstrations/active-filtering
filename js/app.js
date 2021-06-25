;
(function () {

    var root = this;
    var jsPlumb = root.jsPlumb;

    jsPlumbToolkitBrowserUI.ready(function () {

        var toolkit = jsPlumbToolkitBrowserUI.newInstance({
            portDataProperty:"items",
            beforeConnect:function(source, target) {
                if (jsPlumbToolkit.isPort(source) && jsPlumbToolkit.isPort(target)) {

                    // cannot create loopback connections
                    if (source === target) {
                        return false
                    }

                    // cannot connect to Ports on the same Node as the Edge source
                    if (source.getParent() === target.getParent()) {
                        return false
                    }

                    var sourceData = source.data.entries,
                        targetData = target.data.entries;

                    // attempt to match animals
                    for (var i = 0; i < sourceData.length; i++) {
                        if (targetData.indexOf(sourceData[i]) !== -1) {
                            return true
                        }
                    }
                    return false
                }
            }
        });

        var mainElement = document.querySelector("#jtk-demo-connectivity"),
            canvasElement = mainElement.querySelector(".jtk-demo-canvas"),
            miniviewElement = mainElement.querySelector(".miniview");

// ----------------------- this code is the random node generator. it's just for this demo --------------------------------------

        var words = [
            "CAT", "DOG", "COW", "HORSE", "DUCK", "HEN"
        ];

        var randomPort = function(index) {
            var out = [], map = {};
            function _one() {
                var a, done = false;
                while (!done) {
                    a = words[Math.floor(Math.random() * words.length)];
                    done = map[a] !== true;
                    map[a] = true;
                }
                return a;
            }
            out.push(_one());
            out.push(_one());
            return { entries:out, index:index, id:jsPlumbUtil.uuid() };
        };

        var newNode = function() {
            var groupCount = Math.floor(Math.random() * 3) + 1,
                data = {
                    id:jsPlumbUtil.uuid(),
                    items:[]
                };

            for (var i = 0; i < groupCount; i++) {
                data.items.push(randomPort(i));
            }

            return toolkit.addNode(data);
        };


// ---------------------------- / end random node generator ---------------------------------------------

        // initial dataset consists of 5 random nodes.
        var nodeCount = 5;
        for (var i = 0; i < nodeCount;i++) {
            newNode();
        }


        var view = {
            nodes: {
                "default": {
                    templateId: "tmplNode"
                }
            },
            edges: {
                "default": {
                    connector: { type:"StateMachine", options:{ curviness: 10 } },
                    endpoint: { type:"Dot", options:{ radius: 10 } },
                    anchor: { type:"Continuous", options:{ faces:["left", "right"]} }
                }
            }
        };

        var renderer = toolkit.render(canvasElement, {
            zoomToFit: true,
            view: view,
            layout: {
                type: "Spring"
            },
            plugins:[
                {
                    type:"miniview",
                    options:{
                        container:miniviewElement
                    }
                },
                "activeFiltering",
                "lasso"
            ],
            lassoFilter: ".controls, .controls *, .miniview, .miniview *",
            events: {
                canvasClick: function (e) {
                    toolkit.clearSelection();
                },
                modeChanged: function (mode) {
                    renderer.removeClass(document.querySelector(".selected-mode"), "selected-mode");
                    renderer.addClass(document.querySelector("[mode='" + mode + "']"), "selected-mode");
                }
            },
            dragOptions:{
                filter:"[data-jtk-port], [data-jtk-port] *"
            },
            consumeRightClick:false
        });

        // pan mode/select mode
        renderer.on(mainElement, "tap", "[mode]", function () {
            renderer.setMode(this.getAttribute("mode"));
        });

        // on home button tap, zoom content to fit.
        renderer.on(mainElement, "tap", "[reset]", function () {
            toolkit.clearSelection();
            renderer.zoomToFit();
        });

        //
        // assign a class to a new node which brings the user's attention to it. then a little while later,
        // take it off.
        //
        function flash(el) {
            renderer.addClass(el, "hl");
            setTimeout(function() {
                renderer.removeClass(el, "hl");
            }, 1950);
        }

        renderer.on(mainElement, "tap", "[add]", function() {
            var node = newNode();
            renderer.zoomToFit();
            flash(renderer.getRenderedElement(node));
        });

        jsPlumbToolkitSyntaxHighlighter.newInstance(toolkit, ".jtk-demo-dataset", 2);
    });
})();
