angular.module('starter.controllers', ['forceng'])

    .controller('AppCtrl', function ($scope, force) {

        $scope.logout = function () {
            force.logout();
        };

    })

    .controller('ProductListCtrl', function ($scope, $stateParams, $state, force) {
        var prodListOrders = [];
    
        function currency(n) {
            n = parseFloat(n);
            return isNaN(n) ? false : n.toFixed(2);
        }
    
        $scope.addToOrder = function (product) {
            var orderLength = prodListOrders.length,
                ordFound = false;
            
            if (orderLength === 0) {
                prodListOrders.push(product);
            } else {
                for (var ordIdx = 0; ordIdx < orderLength; ordIdx++) {
                    var currentOrder = prodListOrders[ordIdx];
                    if (currentOrder.Id === product.Id) {
                        prodListOrders[ordIdx] = product;
                        ordFound = true;
                    }
                }
                if (ordFound === false) {
                    prodListOrders.push(product);
                }
            }
//            console.log('$scope.addToOrder - product: ' + JSON.stringify(product));
//            console.log('$scope.addToOrder - orders: ' + JSON.stringify(orders));
        };
    
        $scope.confirmOrder = function () {
            var orderTotal = 0,
                orderLength = prodListOrders.length,
                orderDetails = {
                    accountId: "",
                    orderTotal: 0,
                    orderLines: []
                };
            
            orderDetails.accountId = $stateParams.accountId;

            for (var lineIdx = 0; lineIdx < orderLength; lineIdx++){
                if (!isNaN(prodListOrders[lineIdx].OrderQty)) {
                    var subTotal = prodListOrders[lineIdx].OrderQty * prodListOrders[lineIdx].UnitPrice;
                    if (isNaN(prodListOrders[lineIdx].Discount__c)) {
                        prodListOrders[lineIdx].Total = currency(subTotal);
                        orderTotal += subTotal;
                    } else {
                        var discountedTotal = subTotal * (prodListOrders[lineIdx].Discount__c / 100);
                        prodListOrders[lineIdx].DiscountAmt = currency(discountedTotal);
                        var totalAmt = subTotal - discountedTotal;
                        prodListOrders[lineIdx].Total = currency(totalAmt);
                        orderTotal += totalAmt;
                    }
                }
            }
            
            orderDetails.orderLines = prodListOrders;
            orderDetails.orderTotal = currency(orderTotal);
            
            // Here I need to navigate to the order confirm page
//            console.log('ProductListCtrl - orderDetails: ' + JSON.stringify(orderDetails));
            $state.go('app.orderconfirm', {orderDetails: orderDetails});
        };

        force.query("SELECT Price_Book__c FROM Account WHERE Id = '" + $stateParams.accountId + "' LIMIT 1").then(
            function (data) {
                $scope.priceBookId = data.records[0].Price_Book__c;

                force.query("SELECT Id, Name, Product2Id, ProductCode, UnitPrice, Discount__c FROM PricebookEntry WHERE Pricebook2Id = '" + $scope.priceBookId + "' ORDER BY Name").then(
                    function(prices) {
                        var pricesLength = prices.records.length;
                        for (var i = 0; i < pricesLength; i++) {
                            var thisPrice = prices.records[i].UnitPrice;
                            prices.records[i].UnitPrice = currency(thisPrice);
                            delete prices.records[i]["attributes"];
                        }
                        $scope.products = prices.records;
                        force.query("SELECT productId__c, inventoryAmt__c FROM Inventorys__x WHERE storeId__c ='"  + $stateParams.accountId + "'").then(
                            function(inventory) {
                                var inventoryLength = inventory.records.length;
                                for (var j = 0; j < inventoryLength; j++) {
                                    var thisProductId = inventory.records[j].productId__c;
                                    for (var k = 0; k < pricesLength; k++) {
                                        if ($scope.products[k].Id === thisProductId) {
                                            var invAmt = inventory.records[j].inventoryAmt__c;
                                            $scope.products[k].inventoryAmt__c = invAmt;
                                            $scope.products[k].invFlag =
                                                (invAmt < 50) ? 'img/flag_red.gif' : 'img/s.gif';
                                        }
                                    }
                                }
                            });
                    });
            }
        );

    })

    .controller('OrderConfirmCtrl', function ($scope, $stateParams, $state, force) {
    
        var orders = $stateParams.orderDetails;
    
        $scope.submitOrder = function () {
            function getguid() {
                function s4() {
                    return Math.floor((1 + Math.random()) * 0x10000)
                        .toString(16)
                        .substring(1);
                }
                return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
                    s4() + '-' + s4() + s4() + s4();
            }
            
            var opptyTree = {
                "records":[
                    {
                        "attributes": {
                            "type": "Opportunity",
                            "referenceId": "ref1"
                        },
                        "AccountId": "",
                        "Name": "",
                        "CloseDate": "",
                        "StageName": "",
                        "Description": "",
                        "OpportunityLineItems": {
                            "records":[]
                        }
                    }
                ]
            };
            
            // populate the tree to be saved
            opptyTree.records[0].attributes.referenceId = getguid();
            opptyTree.records[0].AccountId = orders.accountId;
            opptyTree.records[0].Name = $scope.formfields.orderName;
            opptyTree.records[0].CloseDate = $scope.formfields.closeDate;
            opptyTree.records[0].StageName = $scope.formfields.stageName;
            opptyTree.records[0].Description = $scope.formfields.orderDesc;

            var numLines = orders.orderLines.length;
            for (var lineIdx = 0; lineIdx < numLines; lineIdx++) {
                var opptyLine = {
                    "attributes": {
                        "type": "OpportunityLineItem",
                        "referenceId": "ref2"
                    },
                    "PricebookEntryId": "",
                    "UnitPrice": 0,
                    "Discount": 0,
                    "Quantity": 0
                };
                
                // populate the opportunity line item details
                opptyLine.attributes.referenceId = getguid();
                opptyLine.PricebookEntryId = orders.orderLines[lineIdx].Id;
                opptyLine.UnitPrice = Number(orders.orderLines[lineIdx].UnitPrice);
                opptyLine.Discount = Number(orders.orderLines[lineIdx].Discount__c);
                opptyLine.Quantity = Number(orders.orderLines[lineIdx].OrderQty);
                
                // add the line item to the tree
                opptyTree.records[0].OpportunityLineItems.records.push(opptyLine);
            }
            
            force.treeSave('Opportunity', opptyTree).then(
                function (response) {
                    console.log('server respose:' + JSON.stringify(response));
//                    $state.go('^.^');
                    $state.go('app.accountlist');
                },
                function() {
                    alert("An error has occurred saving with the TreeSave API.");
                });

            console.log('opptyTree: ' + JSON.stringify(opptyTree));
//            console.log('Button was pressed!');
        };
        
        $scope.formfields = {};
        $scope.formfields.orderName = "";
        $scope.formfields.closeDate = "";
        $scope.formfields.orderDesc = "";
        $scope.formfields.stageName = "Draft";
        $scope.formfields.orderTotal = orders.orderTotal;
        $scope.products = orders.orderLines;
    
        // Need to retrieve the account name
        force.query("SELECT Name FROM Account where Id = '" + orders.accountId + "'").then(
            function (data) {
                if (data.hasOwnProperty("records")) {
                    $scope.formfields.accountName = data.records[0].Name;
                } else {
                    console.log('Query response does not contain records!');
                    console.log(data);
                }
            },
            function (data) {
                console.log('an error was incurred while the order account: ', data);
            }
        );

    })

    .controller('AccountListCtrl', function ($scope, force) {

        force.query('SELECT Id, Name FROM Account ORDER BY Name').then(
            function (data) {
                $scope.accounts = data.records;
            }
        );

    })

    .controller('AccountCtrl', function ($scope, $stateParams, force) {

        force.retrieve('account', $stateParams.accountId, 'id,name,phone,billingaddress').then(
            function (account) {
                $scope.account = account;
            }
        );

    });
