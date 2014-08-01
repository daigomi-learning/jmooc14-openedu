//	require([
//	    "dojox/grid/EnhancedGrid",
//		"dojox/grid/enhanced/plugins/Pagination",
//	    "dojo/data/ItemFileReadStore",
//	    "dojo/request",
//	    "dojo/domReady!"
//		], function(EnhancedGrid, Memory, ObjectStore, request){
dojo.require("dojox.grid.EnhancedGrid");
dojo.require("dojox.grid.enhanced.plugins.Pagination");
dojo.require("dojo.data.ItemFileReadStore");
dojo.require('dojo.request');

dojo.ready(function(){
    dojo.request.get("./servicecard.json",{
            handleAs: "json"
        }).then(function(items) {
        var datastore = new dojo.data.ItemFileReadStore({ data: { items: items }})
//			console.log(items);
        /*set up layout*/
        var layout = [[
            {name: 'id', field: 'id', width: '50px'},
//            {name: 'user', field: 'user_id', width: '50px'},
            {name: 'タイトル', field: 'title', width: '300px'},
            {name: 'リファレンス', field: 'reference', width: '250px'},
            {name: 'count', field: 'count', width: '50px'}
        ]];
        /*create a new grid:*/
        var grid = new dojox.grid.EnhancedGrid({
            id: 'grid',
            store: datastore,
            structure: layout,
            query:{ title: '*' },
        //		rowSelector: '20px',
            autoHeight: true,
            plugins: {
                pagination: {
                    pageSizes: ["25", "50", "100"],
                    description: true,
                    sizeSwitch: true,
                    pageStepper: true,
                    gotoButton: true,
                            /*page step to be displayed*/
                    maxPageStep: 4,
                            /*position of the pagination bar*/
                    position: "bottom"
                }
            }
        }, document.createElement('div'));
        /*append the new grid to the div*/
        dojo.byId("gridDiv").appendChild(grid.domNode);

        /*Call startup() to render the grid*/
        grid.startup();

        dojo.connect(grid, "onRowClick", grid, function(evt){
            var idx = evt.rowIndex;
            var item = this.getItem(idx);

            dojo.byId("title").innerHTML = this.store.getValue(item, "title");
            dojo.byId("contents").innerHTML = this.store.getValue(item, "contents");
            dojo.byId("reference").innerHTML = this.store.getValue(item, "reference");
            dojo.byId("user_id").innerHTML = this.store.getValue(item, "user_id");
            dojo.byId("card_id").innerHTML = this.store.getValue(item, "id");
            dojo.byId("created").innerHTML = this.store.getValue(item, "created");
            var image_src = "/service/screenshot/" + this.store.getValue(item, "screenshot");
            console.log(image_src);
            node = dojo.byId("screenshot");
            console.log(dojo.getAttr(node, "src"));
            dojo.setAttr(node, "src", image_src);
        });
    });
})
