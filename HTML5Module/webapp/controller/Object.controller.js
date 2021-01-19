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
        onInit: function () {
            // Model used to manipulate control states. The chosen values make sure,
            // detail page shows busy indication immediately so there is no break in
            // between the busy indication for loading the view's meta data
            var oViewModel = new JSONModel({
                busy: true,
                delay: 0
            });
            this.getRouter().getRoute("object").attachPatternMatched(this._onObjectMatched, this);
            this.setModel(oViewModel, "objectView");
            this.oController = this;
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
        onNavBack: function () {
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
        _onObjectMatched: function (oEvent) {
            this.objectId = oEvent.getParameter("arguments").objectId;
            //this.screeningTaskId =  oEvent.getParameter("arguments").screeningTaskId; 
            this._bindView("/MyRequests" + this.objectId);
            this._bindMasterList();
            //destroying content of table everytime we enter for new candidate to get fresh data
            this.getView().byId("idEmployementHistoryTable").destroyItems();
            this.getView().byId("idDrugUseTestTable").destroyItems();

            //this._bindEmploymentHistoryTable(this.screeningTaskId);

        },

		/**
		 * Binds the view to the object path.
		 * @function
		 * @param {string} sObjectPath path to the object to be bound
		 * @private
		 */
        _bindView: function (sObjectPath) {
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
        _bindMasterList: function () {
            var list = this.getView().byId("masterPageListID"),

                //changing StandardListItem item to CustomListItem to include microchart
                oItemTemplate = new sap.m.CustomListItem({
                    type: sap.m.ListType.Active,
                    content: [
                        new sap.m.HBox({
                            items: [
                                new sap.ui.core.Icon({
                                    size: "2rem",
                                    src: "sap-icon://attachment-photo",
                                }).addStyleClass("sapUiSmallMarginBegin sapUiSmallMarginTopBottom"),
                                new sap.m.VBox({
                                    items: [
                                        new sap.m.Title({
                                            text: "{screeningTaskTypeDescription}"
                                        }),
                                        new sap.m.Label({
                                            text: "{screeningTaskTypeName}"
                                        })]
                                }).addStyleClass("sapUiSmallMarginBegin sapUiSmallMarginTopBottom")

                            ]
                        })

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
            var oDataTemplate = new sap.ui.core.CustomData({ key: "screeningId", value: "{ID}" });

            // add the CustomData template to the item template
            oItemTemplate.addCustomData(oDataTemplate);

            list.bindItems({
                path: "/MyScreeningTask",
                template: oItemTemplate,
                parameters: {
                    $filter: "candidateID eq " + this.objectId
                }
            })
        },

        _navToDetailPage: function (oEvent) {
            var splitApp = this.getView().byId("SplitContDemo");
            var screeningTaskId = oEvent.getParameters().listItem.getBindingContext().getProperty("ID");
            var sListItemtitle = oEvent.getParameters().listItem.getBindingContext().getProperty("screeningTaskTypeDescription");
            switch (sListItemtitle) {
                case "Employment History":
                    splitApp.toDetail(this.createId("EmploymentHistorydetailPage"));
                    this._bindEmploymentHistoryTable(screeningTaskId);
                    break;
                case "Drug Use Test":
                    splitApp.toDetail(this.createId("DrugUseTestDetailPage"));
                    this._bindDrugUseTestTable(screeningTaskId);
                    break;
            }
        },

        _bindEmploymentHistoryTable: function (screeningTaskId) {
            var oThis = this;
            var oTable = this.getView().byId("idEmployementHistoryTable");
            oTable.bindItems({
                //tried binding with EmploymentHistory entity for property update since view does not support update
                //change the code back to view binding to try post request approach
                path: "/EmploymentHistoryType",
                template: new sap.m.ColumnListItem({
                    cells: [
                        new sap.m.ObjectIdentifier({ title: "{employer}" }),
                        new sap.m.Text({ text: "{designation}" }),
                        new sap.m.Text({ text: "{ctc}" }),
                        new sap.m.Text({ text: "{email}" }),
                        new sap.m.Text({ text: "{phone}" }),
                        new sap.m.Button({ text: "1", icon: "sap-icon://show", press: oThis._showDocument }),
                        new sap.m.Text({ text: "{statusDesc}" }),
                        new sap.m.Button({ icon: "sap-icon://accept", press: oThis._acceptEmploymentHistory.bind(oThis) }),
                        new sap.m.Button({ icon: "sap-icon://decline", press: oThis._acceptEmploymentHistory.bind(oThis) }),
                        // new sap.m.Text({text:"{employmentConfirmation}"}),
                        // new sap.m.Text({text:"{ctcConfirmation}"}),  
                        // new sap.m.Text({text:"{documentsVerified}"}),                                 
                        // new sap.m.Text({text:"{conductDesc}"}),  
                        // new sap.m.Text({text:"{comments}"})  

                    ]
                }),
                templateShareable: true,
                parameters: {
                    $filter: "screeningTaskID eq " + screeningTaskId
                }
            });
        },

        _bindDrugUseTestTable: function (screeningTaskId) {
            var oTable = this.getView().byId("idDrugUseTestTable");
            oTable.bindItems({
                path: "/DrugUseType",
                template: new sap.m.ColumnListItem({
                    cells: [
                        new sap.m.ObjectIdentifier({ title: "{drugTypeDescription}" }),
                        new sap.m.Text({ text: "{testRequirement}" }),
                        new sap.m.Text({ text: "{permissibleLimit}" }),
                        new sap.m.Text({ text: "{testDate}" }),
                        new sap.m.Text({ text: "{testResult}" }),
                        new sap.m.Text({ text: "{amountDetected}" }),
                        new sap.m.Text({ text: "{comment}" })
                    ]
                }),
                templateShareable: true,
                parameters: {
                    $filter: "screeningTaskID eq " + screeningTaskId
                }
            });
        },

        _showDocument: function (oEvent) {
            var opdfViewer = new sap.m.PDFViewer();
            //this.getView().addDependent(opdfViewer);
            var sServiceURL = oEvent.getSource().getModel().sServiceUrl;
            // var screeningTaskId = oEvent.getSource().getBindingContext().getProperty("screeningTask_ID");

            //in the below commented line, url is hardcoded and it does download something directy I guess the pdf type
            //format is problem. But when I try filtering document by screeningtask id, without adding "/content" it gives me 2 objects 
            //but can't see anything like "content". after adding "/content" it gives 400 error.
            // need to check how to pass the id and then content so that it makes url like hardcoded line here

            var sSource = sServiceURL + "Documents(c657194e-7632-473c-bd03-145cd74aa0e1)/content";
            // var sSource = sServiceURL + "Documents?$filter=screeningTask_ID eq "+ screeningTaskId +"/content";

            opdfViewer.setSource(sSource);
            opdfViewer.setTitle("PDF file");
            opdfViewer.open();
        },

        _acceptEmploymentHistory: function (oEvent) {
            this.currentEmployerId = oEvent.getSource().getBindingContext().getProperty("ID");
            var currentEmployer = oEvent.getSource().getBindingContext().getProperty("employer");
            this.currentBinding = oEvent.getSource().getBindingContext().getBinding();
            if (!this.oConfirmDialog) {

                this.oConfirmDialog = new sap.m.Dialog({
                    type: sap.m.DialogType.Message,
                    //afterClose: this.afterCloseDialog,
                    title: "Employment Confirmation - " + currentEmployer,
                    content: [
                        new sap.ui.layout.VerticalLayout({
                            width: "400px",
                            content: [
                                new sap.ui.layout.HorizontalLayout({
                                    content: [
                                        new sap.m.Text({ text: "Employment Confirmation: " }).addStyleClass("sapUiSmallMargin"),
                                        new sap.m.Switch("empConfirmSwitch", { type: "AcceptReject", state: "{employmentConfirmation}" }),
                                    ]
                                }),

                                new sap.ui.layout.HorizontalLayout({
                                    content: [
                                        new sap.m.Text({ text: "CTC Confirmation: " }).addStyleClass("sapUiSmallMargin"),
                                        new sap.m.Switch("ctcConfirmationSwitch", { type: "AcceptReject", state: "{ctcConfirmation}" }),
                                    ]
                                }),

                                new sap.ui.layout.HorizontalLayout({
                                    content: [
                                        new sap.m.Text({ text: "Documents Verified: " }).addStyleClass("sapUiSmallMargin"),
                                        new sap.m.Switch("documentsVerifiedSwitch", { type: "AcceptReject", state: "{documentsVerified}" }),
                                    ]
                                }),

                                new sap.ui.layout.HorizontalLayout({
                                    content: [

                                        new sap.m.Text({ text: "Conduct: " }).addStyleClass("sapUiSmallMargin"),
                                        new sap.m.ComboBox("conductComboBox", {
                                            selectedKey: "{conductID}", items: [
                                                new sap.ui.core.Item({ key: "AAAAAAAA-AAAA-AAAA-AAAA-AAAAAAAAAAAA", text: "Very Good" }),
                                                new sap.ui.core.Item({ text: "Good" }),
                                                new sap.ui.core.Item({ text: "Questionable" }),
                                                new sap.ui.core.Item({ text: "Inappropriate" })
                                            ]
                                        })

                                    ]
                                }),

                                new sap.ui.layout.HorizontalLayout({
                                    content: [
                                        new sap.m.Text({ text: "Comments: " }).addStyleClass("sapUiSmallMargin"),
                                        new sap.m.TextArea("commentsText", {
                                            width: "100%",
                                            placeholder: "Add note (optional)",
                                            value: "{comments}"
                                        })
                                    ]
                                })
                            ]
                        }),
                    ],
                    beginButton: new sap.m.Button({
                        type: sap.m.ButtonType.Emphasized,
                        text: "Save",
                        press: function (oEvent) {
                            // this.oConfirmDialog.setBindingContext(this.getEventingParent().getBindingContext());
                            //var currentEmployerId = this.getEventingParent().getBindingContext().getProperty("ID");
                            var empConfirmSwitch = sap.ui.getCore().byId("empConfirmSwitch").getState();
                            var ctcConfirmationSwitch = sap.ui.getCore().byId("ctcConfirmationSwitch").getState();
                            var documentsVerifiedSwitch = sap.ui.getCore().byId("documentsVerifiedSwitch").getState();
                            var conductComboBox = sap.ui.getCore().byId("conductComboBox").getSelectedKey();
                            var commentsText = sap.ui.getCore().byId("commentsText").getValue();

                            //set property should update the service directy without a post call
                            //this approach is working if we have all the columns in employment history table itself but
                            //in our case we have a popup over it and somehow it's not working, need to reasearch more about this approach

                            // this.getEventingParent().getBindingContext().setProperty("employmentConfirmation", empConfirmSwitch);
                            // this.getEventingParent().getBindingContext().setProperty("ctcConfirmation", ctcConfirmationSwitch);
                            // this.getEventingParent().getBindingContext().setProperty("documentsVerified", documentsVerifiedSwitch);
                            //this.getEventingParent().getBindingContext().setProperty("conductID", conductComboBox);
                            // this.getEventingParent().getBindingContext().setProperty("comments", commentsText);

                            //  "ID": "AAAAAAAA-AAAA-AAAA-AAAA-AAAAAAAAAAAC",
                            //  "employmentConfirmation": true, 
                            //  "ctcConfirmation": true,
                            //  "documentsVerified": true,
                            //  "conductID": "AAAAAAAA-AAAA-AAAA-AAAA-AAAAAAAAAAAB",
                            //  "comments": "New comments"

                            var obj = {
                                ID: this.currentEmployerId,
                                employmentConfirmation: empConfirmSwitch,
                                ctcConfirmation: ctcConfirmationSwitch,
                                documentsVerified: documentsVerifiedSwitch,
                                // conductID: conductComboBox,  <- has to be a proper uuid, an empty string is not allowed
                                comments: commentsText
                            };

                            jQuery.ajax({
                                type: 'POST',
                                contentType: 'application/json',
                                url: "/nsHTML5Module/bgcportal/api/v1/confirmEmploymentHistory",
                                data: JSON.stringify(obj),
                                success: function (data) {
                                    console.log("success: " + JSON.stringify(data));
                                },
                                error: function (e) {
                                    console.log("error: " + JSON.stringify(e));
                                }
                            });

                            this.oConfirmDialog.close();
                        }.bind(this)
                    }),
                    endButton: new sap.m.Button({
                        text: "Cancel",
                        press: function () {
                            this.oConfirmDialog.close();
                        }.bind(this)
                    })
                });
            }
            //setting the binding context for set property approach
            //this.oConfirmDialog.setBindingContext(this.getEventingParent().getBindingContext());
            this.oConfirmDialog.open();

        },
        afterCloseDialog: function (oEvent) {
            oEvent.getSource().getParent().destroy();
        },
        _onBindingChange: function () {
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