// @ts-nocheck
sap.ui.define([
	"./BaseController",
	"sap/ui/model/json/JSONModel",
    "sap/ui/core/routing/History",
    "sap/ui/thirdparty/jquery",
	"../model/formatter"
], function (BaseController, JSONModel, History, jquery, formatter) {
	"use strict";

	return BaseController.extend("ns.HTML5Module.controller.Object", {

		formatter: formatter,

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		/**
		 * Called when the worklist controller is instantiated.
		 * @public
		 */
		onInit : function () {
			// Model used to manipulate control states. The chosen values make sure,
			// detail page shows busy indication immediately so there is no break in
			// between the busy indication for loading the view's meta data
			var oViewModel = new JSONModel({
					busy : true,
					delay : 0
				});
			this.getRouter().getRoute("object").attachPatternMatched(this._onObjectMatched, this);
            this.setModel(oViewModel, "objectView");
            // this._pdfViewer = new sap.m.PDFViewer();;
			// this.getView().addDependent(this._pdfViewer);
		},
		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */
	    onAfterRendering: function () {
			var oSplitCont = this.getView().byId("SplitContDemo"),
				ref = oSplitCont.getDomRef() && oSplitCont.getDomRef().parentNode;
			// set all parent elements to 100% height, this should be done by app developer, but just in case
			if (ref && !ref._sapUI5HeightFixed) {
				ref._sapUI5HeightFixed = true;
				while (ref && ref !== document.documentElement) {
					var $ref = jquery(ref);
					if ($ref.attr("data-sap-ui-root-content")) { // Shell as parent does this already
						break;
					}
					if (!ref.style.height) {
						ref.style.height = "100%";
					}
					ref = ref.parentNode;
				}
			}
		},

		/**
		 * Event handler  for navigating back.
		 * It there is a history entry we go one step back in the browser history
		 * If not, it will replace the current entry of the browser history with the worklist route.
		 * @public
		 */
		onNavBack : function() {
			var sPreviousHash = History.getInstance().getPreviousHash();
			if (sPreviousHash !== undefined) {
				// eslint-disable-next-line sap-no-history-manipulation
				history.go(-1);
			} else {
				this.getRouter().navTo("worklist", {}, true);
			}
		},

		/* =========================================================== */
		/* internal methods                                            */
		/* =========================================================== */

		/**
		 * Binds the view to the object path.
		 * @function
		 * @param {sap.ui.base.Event} oEvent pattern match event in route 'object'
		 * @private
		 */
		_onObjectMatched : function (oEvent) {
            this.objectId =  oEvent.getParameter("arguments").objectId;
            this.screeningTaskId =  oEvent.getParameter("arguments").screeningTaskId; 
            this._bindView("/MyRequests" + this.objectId);
            this._bindMasterList();
            this._bindEmploymentHistoryTable(this.screeningTaskId);
           
		},

		/**
		 * Binds the view to the object path.
		 * @function
		 * @param {string} sObjectPath path to the object to be bound
		 * @private
		 */
		_bindView : function (sObjectPath) {
			var oViewModel = this.getModel("objectView");

			this.getView().bindElement({
				path: sObjectPath,
				events: {
					change: this._onBindingChange.bind(this),
					dataRequested: function () {
						oViewModel.setProperty("/busy", true);
					},
					dataReceived: function () {
						oViewModel.setProperty("/busy", false);
					}
				}
			});
        },
        
	    /**
		 * Binds the master panel list to the screening tasks.
		 * @function
		 * @param {string} sObjectPath path to the object to be bound
		 * @private
		 */
        _bindMasterList: function(){
           var list = this.getView().byId("masterPageListID"),
         
        //    oItemTemplate = new sap.m.StandardListItem({
        //            title:"{screeningTaskTypeDescription}",
        //             description:"{screeningTaskTypeName}",
        //             counter:"{completion}",
        //             type : "Navigation"
        //         });

        //changing StandardListItem item to CustomListItem to include microchart
             oItemTemplate = new sap.m.CustomListItem({
                           type: sap.m.ListType.Active,
						   content:[     
                               new sap.m.HBox({ items:[
                                    new sap.ui.core.Icon({
                                                size:"2rem",
                                                src:"sap-icon://attachment-photo",
                                                }).addStyleClass("sapUiSmallMarginBegin sapUiSmallMarginTopBottom"),
                                     new sap.m.VBox({items:[
                                                 new sap.m.Title({
                                                         text: "{screeningTaskTypeDescription}"
                                                             }),
                                                 new sap.m.Label({
                                                         text: "{screeningTaskTypeName}"
                                                             })]
                                                 }).addStyleClass("sapUiSmallMarginBegin sapUiSmallMarginTopBottom")
                               
                                    ]})
                        
                                        // code to add radial chart to show completion(like mockup) in the list
                                        // but somehow it does not take sap.suite as a valid library!

                                        // new sap.m.VBox({vertical:true, items:[
                                            // new sap.suite.ui.microchart.RadialMicroChart({
                                            //     size:"S",
                                            //     percentage:"{completion}", 
                                            //     valueColor:"Error",
                                            //     class:"sapUiSmallMargin"
                                            // })
                                        // ]
										// })
                                            ]
                       })
            // create a CustomData template, set its key to "answer" and bind its value to the answer data
			//var oDataTemplate = new sap.ui.core.CustomData({key:"screeningId", value: "{ID}"});

			// add the CustomData template to the item template
			//oItemTemplate.addCustomData(oDataTemplate);
                
           list.bindItems({
               path:"/MyScreeningTask",
               template: oItemTemplate,
               parameters: {
					$filter: "candidateID eq " +  this.objectId
				}
           })
        },

        _navToDetailPage: function(oEvent){
            var splitApp =  this.getView().byId("SplitContDemo");
            //var screeningTaskId = oEvent.getParameters().listItem.getBindingContext().getProperty("ID");
            var sListItemtitle = oEvent.getParameters().listItem.getBindingContext().getProperty("screeningTaskTypeDescription");
            switch(sListItemtitle){
            case "Employment History":
                  splitApp.toDetail(this.createId("EmploymentHistorydetailPage"));
                  this._bindEmploymentHistoryTable();
                  break;
            case "Drug Use Test":
                  splitApp.toDetail(this.createId("DrugUseTestDetailPage"));
                  this._bindDrugUseTestTable();
                  break;
            }
        },
       
        _bindEmploymentHistoryTable: function(){
          var oThis=this;
           var oTable = this.getView().byId("idEmployementHistoryTable");           
                oTable.bindItems({
                     path:"/EmploymentHistory",
                     template: new sap.m.ColumnListItem({
						  cells:[             
                                new sap.m.ObjectIdentifier({title:"{employer}"}),
                                new sap.m.Text({text:"{designation}"}),
                                new sap.m.Text({text:"{ctc}"}),
                                new sap.m.Text({text:"{email}"}),
                                new sap.m.Text({text:"{phone}"}),
                                new sap.m.Button({text:"1", icon:"sap-icon://show", press: oThis._showDocument}),                              
                                new sap.m.Text({text:"Pending"}),
                                new sap.m.Button({icon:"sap-icon://accept"}),
                                new sap.m.Button({icon:"sap-icon://decline"}),
                                new sap.m.Text({text:"{screeningTask_ID}"})                               
							 ]
						  }),
                     templateShareable: true,
                     parameters: {
                      $filter: "screeningTask_ID eq " +  this.screeningTaskId
                    }
                 });            
        },
        
        _bindDrugUseTestTable: function(){
                var oTable = this.getView().byId("idDrugUseTestTable");      
                oTable.bindItems({
                    path:"/DrugUseType",
                    template: new sap.m.ColumnListItem({
						  cells:[             
                                new sap.m.ObjectIdentifier({title:"{drugTypeDescription}"}),
                                new sap.m.Text({text:"{testRequirement}"}),
                                new sap.m.Text({text:"{permissibleLimit}"}),
                                new sap.m.Text({text:"{testDate}"}),
                                new sap.m.Text({text:"{testResult}"}),
                                new sap.m.Text({text:"{amountDetected}"}),
                                new sap.m.Text({text:"{comment}"})
							 ]
						  }),
                    templateShareable: true,
                     parameters: {
                           $filter: "screeningTaskID eq " +  this.screeningTaskId
                     }
                });
        },

        _showDocument: function(oEvent){	
			var opdfViewer = new sap.m.PDFViewer();
            //this.getView().addDependent(opdfViewer);
            var sServiceURL =  oEvent.getSource().getModel().sServiceUrl;
            var screeningTaskId = oEvent.getSource().getBindingContext().getProperty("screeningTask_ID");

            //in the below commented line, url is hardcoded and it does download something directy I guess the pdf type
            //format is problem. But when I try filtering document by screeningtask id, without adding "/content" it gives me 2 objects 
            //but can't see anything like "content". after adding "/content" it gives 400 error.
            // need to check how to pass the id and then content so that it makes url like hardcoded line here
            
           // var sSource = sServiceURL + "Documents(31d09ec3-e69b-4b78-84f7-520a61c6bc38)/content";
            var sSource = sServiceURL + "Documents?$filter=screeningTask_ID eq "+ screeningTaskId +"/content";

			opdfViewer.setSource(sSource);
			opdfViewer.setTitle("PDF file");
			opdfViewer.open();			
        },

		_onBindingChange : function () {
			var oView = this.getView(),
				oViewModel = this.getModel("objectView"),
				oElementBinding = oView.getElementBinding();

			// No data for the binding
			if (!oElementBinding.getBoundContext()) {
				this.getRouter().getTargets().display("objectNotFound");
				return;
			}

			var oResourceBundle = this.getResourceBundle();

			oView.getBindingContext().requestObject().then((function (oObject) {
				var sObjectId = oObject.ID,
					sObjectName = oObject.candidate_ID;


				oViewModel.setProperty("/busy", false);
				oViewModel.setProperty("/shareSendEmailSubject",
					oResourceBundle.getText("shareSendEmailObjectSubject", [sObjectId]));
				oViewModel.setProperty("/shareSendEmailMessage",
					oResourceBundle.getText("shareSendEmailObjectMessage", [sObjectName, sObjectId, location.href]));
			}).bind(this));
		}

	});

});