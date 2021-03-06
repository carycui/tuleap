describe("TuleapArtifactModalController", function() {
    var $scope, $q, $controller, $timeout, controller_params, TuleapArtifactModalController, $modalInstance,
        TuleapArtifactModalRestService, TuleapArtifactModalValidateService,
        TuleapArtifactModalParentService, TuleapArtifactModalFieldDependenciesService,
        TuleapArtifactModalLoading, TuleapArtifactModalFileUploadService,
        mockCallback;
    beforeEach(function() {
        module('tuleap.artifact-modal', function($provide) {
            $provide.decorator('TuleapArtifactModalRestService', function($delegate) {
                spyOn($delegate, "createArtifact");
                spyOn($delegate, "editArtifact");
                spyOn($delegate, "searchUsers");

                return $delegate;
            });

            $provide.decorator('TuleapArtifactModalValidateService', function($delegate) {
                spyOn($delegate, "validateArtifactFieldsValues");

                return $delegate;
            });

            $provide.decorator('TuleapArtifactModalFieldDependenciesService', function($delegate) {
                spyOn($delegate, "getTargetFieldPossibleValues");
                spyOn($delegate, "setUpFieldDependenciesActions");

                return $delegate;
            });

            $provide.decorator('TuleapArtifactModalParentService', function($delegate) {
                spyOn($delegate, "canChooseArtifactsParent");

                return $delegate;
            });

            $provide.decorator('TuleapArtifactModalFileUploadService', function($delegate) {
                spyOn($delegate, "uploadAllTemporaryFiles");

                return $delegate;
            });
        });

        inject(function(
            _$controller_,
            $rootScope,
            _$q_,
            _$timeout_,
            _TuleapArtifactModalRestService_,
            _TuleapArtifactModalValidateService_,
            _TuleapArtifactModalParentService_,
            _TuleapArtifactModalFieldDependenciesService_,
            _TuleapArtifactModalLoading_,
            _TuleapArtifactModalFileUploadService_
        ) {
            $q = _$q_;
            TuleapArtifactModalRestService              = _TuleapArtifactModalRestService_;
            TuleapArtifactModalValidateService          = _TuleapArtifactModalValidateService_;
            TuleapArtifactModalParentService            = _TuleapArtifactModalParentService_;
            TuleapArtifactModalFieldDependenciesService = _TuleapArtifactModalFieldDependenciesService_;
            TuleapArtifactModalLoading                  = _TuleapArtifactModalLoading_;
            TuleapArtifactModalFileUploadService        = _TuleapArtifactModalFileUploadService_;

            $modalInstance = jasmine.createSpyObj("$modalInstance", [
                "close",
                "dismiss"
            ]);

            mockCallback = jasmine.createSpy("displayItemCallback");
            $modalInstance.opened = $q.defer().promise;
            $modalInstance.result = $q.defer().promise;
            $scope = $rootScope.$new();
            $timeout = _$timeout_;

            $controller = _$controller_;
            controller_params = {
                $scope: $scope,
                $modalInstance: $modalInstance,
                modal_model: {
                    title: {
                        content: ""
                    }
                },
                TuleapArtifactModalRestService             : TuleapArtifactModalRestService,
                TuleapArtifactModalValidateService         : TuleapArtifactModalValidateService,
                TuleapArtifactModalLoading                 : TuleapArtifactModalLoading,
                TuleapArtifactModalParentService           : TuleapArtifactModalParentService,
                TuleapArtifactModalFieldDependenciesService: TuleapArtifactModalFieldDependenciesService,
                TuleapArtifactModalFileUploadService       : TuleapArtifactModalFileUploadService,
                displayItemCallback                        : mockCallback
            };
        });
    });

    describe("init() -", function() {
        describe("", function() {
            beforeEach(function() {
                spyOn($scope, "$watch");
                TuleapArtifactModalFieldDependenciesService.setUpFieldDependenciesActions.and.callThrough();
            });

            it("when I load the controller, then field dependencies watchers will be set once for each different source field", function() {
                controller_params.modal_model.tracker = {
                    fields: [
                        { field_id: 22 }
                    ],
                    workflow: {
                        rules: {
                            lists: [
                                {
                                    source_field_id: 43,
                                    source_value_id: 752,
                                    target_field_id: 22,
                                    target_value_id: 519
                                }
                            ]
                        }
                    }
                };

                TuleapArtifactModalController = $controller('TuleapArtifactModalController', controller_params);

                expect($scope.$watch).toHaveBeenCalled();
                expect($scope.$watch.calls.count()).toEqual(1);
                expect(TuleapArtifactModalFieldDependenciesService.setUpFieldDependenciesActions).toHaveBeenCalledWith(controller_params.modal_model.tracker, jasmine.any(Function));
            });
        });
    });

    describe("isThereAtLeastOneFileField() -", function() {
        beforeEach(function() {
            TuleapArtifactModalController = $controller('TuleapArtifactModalController', controller_params);
        });

        it("Given that there were two file fields in the model's field values, when I check if there is at least one file field, then it will return true", function() {
            var values = [
                { field_id: 95, type: "file" },
                { field_id: 72, type: "int" },
                { field_id: 64, type: "file" }
            ];
            TuleapArtifactModalController.values = values;

            var result = TuleapArtifactModalController.isThereAtLeastOneFileField();

            expect(result).toBeTruthy();
        });

        it("Given that there was no file field in the model's field values, when I check if there is at least one file field, then it will return false", function() {
            var values = [
                { field_id: 62, type: "int" }
            ];
            TuleapArtifactModalController.values = values;

            var result = TuleapArtifactModalController.isThereAtLeastOneFileField();

            expect(result).toBeFalsy();
        });
    });

    describe("submit() - Given a tracker id, field values, a callback function", function() {
        beforeEach(function() {
            TuleapArtifactModalValidateService.validateArtifactFieldsValues.and.callFake(function(values) {
                return values;
            });
        });

        it("and no artifact_id, when I submit the modal to Tuleap, then the field values will be validated, the artifact will be created , the modal will be closed and the callback will be called", function() {
            var create_request = $q.defer();
            TuleapArtifactModalRestService.createArtifact.and.returnValue(create_request.promise);
            controller_params.modal_model.creation_mode = true;
            controller_params.modal_model.tracker_id    = 39;
            TuleapArtifactModalController               = $controller('TuleapArtifactModalController', controller_params);
            var values = [
                { field_id: 359, value: 907 },
                { field_id: 613, bind_value_ids: [919]}
            ];
            TuleapArtifactModalController.values = values;

            TuleapArtifactModalController.submit();
            expect(TuleapArtifactModalLoading.loading).toBeTruthy();
            create_request.resolve({ id: 3042 });
            $scope.$apply();

            expect(TuleapArtifactModalValidateService.validateArtifactFieldsValues).toHaveBeenCalledWith(values, true);
            expect(TuleapArtifactModalRestService.createArtifact).toHaveBeenCalledWith(39, values);
            expect(TuleapArtifactModalRestService.editArtifact).not.toHaveBeenCalled();
            expect($modalInstance.close).toHaveBeenCalled();
            expect(TuleapArtifactModalLoading.loading).toBeFalsy();
            expect(mockCallback).toHaveBeenCalled();
        });

        it("and an artifact_id to edit, when I submit the modal to Tuleap, then the field values will be validated, the artifact will be edited, the modal will be closed and the callback will be called", function() {
            var edit_request = $q.defer();
            TuleapArtifactModalRestService.editArtifact.and.returnValue(edit_request.promise);
            controller_params.modal_model.creation_mode = false;
            controller_params.modal_model.artifact_id = 8155;
            controller_params.modal_model.tracker_id = 186;
            TuleapArtifactModalController = $controller('TuleapArtifactModalController', controller_params);
            var values = [
                { field_id: 983, value: 741 },
                { field_id: 860, bind_value_ids: [754]}
            ];
            var followup_comment = {
                body: 'My comment',
                format: 'text'
            };
            TuleapArtifactModalController.values           = values;
            TuleapArtifactModalController.followup_comment = followup_comment;

            TuleapArtifactModalController.submit();
            expect(TuleapArtifactModalLoading.loading).toBeTruthy();
            edit_request.resolve({ id: 8155 });
            $scope.$apply();

            expect(TuleapArtifactModalValidateService.validateArtifactFieldsValues).toHaveBeenCalledWith(values, false);
            expect(TuleapArtifactModalRestService.editArtifact).toHaveBeenCalledWith(8155, values, followup_comment);
            expect(TuleapArtifactModalRestService.createArtifact).not.toHaveBeenCalled();
            expect($modalInstance.close).toHaveBeenCalled();
            expect(TuleapArtifactModalLoading.loading).toBeFalsy();
            expect(mockCallback).toHaveBeenCalledWith(8155);
        });

        it("and given that there were 2 file fields, when I submit the modal to Tuleap, then all temporary files chosen in those fields will be uploaded before fields are validated", function() {
            TuleapArtifactModalController    = $controller('TuleapArtifactModalController', controller_params);
            var first_field_temporary_files  = [{ description: "one" }];
            var second_field_temporary_files = [{ description: "two" }];
            var first_file_field_value = {
                field_id: 198,
                temporary_files: first_field_temporary_files,
                type: "file",
                value: [66]
            };
            var second_file_field_value = {
                field_id: 277,
                temporary_files: second_field_temporary_files,
                type: "file",
                value: []
            };
            var first_upload  = $q.defer();
            var second_upload = $q.defer();
            TuleapArtifactModalFileUploadService.uploadAllTemporaryFiles.and.callFake(function(temporary_files) {
                switch (temporary_files[0].description) {
                    case "one":
                        return first_upload.promise;
                    case "two":
                        return second_upload.promise;
                }
            });
            var edit_request = $q.defer();
            TuleapArtifactModalRestService.editArtifact.and.returnValue(edit_request.promise);
            var values = [first_file_field_value, second_file_field_value];
            TuleapArtifactModalController.values = values;

            TuleapArtifactModalController.submit();
            first_upload.resolve([47]);
            second_upload.resolve([71, undefined]);
            edit_request.resolve({ id: 144 });
            $scope.$apply();

            expect(TuleapArtifactModalFileUploadService.uploadAllTemporaryFiles).toHaveBeenCalledWith(first_field_temporary_files);
            expect(TuleapArtifactModalFileUploadService.uploadAllTemporaryFiles).toHaveBeenCalledWith(second_field_temporary_files);
            expect(first_file_field_value.value).toEqual([66, 47]);
            expect(second_file_field_value.value).toEqual([71]);
        });

        it("and given the server responded an error, when I submit the modal to Tuleap, then the modal will not be closed and the callback won't be called", function() {
            var edit_request = $q.defer();
            TuleapArtifactModalRestService.editArtifact.and.returnValue(edit_request.promise);
            TuleapArtifactModalController = $controller('TuleapArtifactModalController', controller_params);

            TuleapArtifactModalController.submit();
            edit_request.reject();
            $scope.$apply();

            expect($modalInstance.close).not.toHaveBeenCalled();
            expect(mockCallback).not.toHaveBeenCalled();
            expect(TuleapArtifactModalLoading.loading).toBeFalsy();
        });
    });

    describe("Field dependency watchers - Given a field dependency rule was defined in the tracker", function() {
        beforeEach(function() {
            TuleapArtifactModalFieldDependenciesService.setUpFieldDependenciesActions.and.callThrough();
        });

        it("and given there was only one target value, when I change the source field's value, then the field dependencies service will be called to modify the target field and the target field's value will be set according to the dependency rule", function() {
            var target_field = {
                field_id: 58,
                values: [
                    { id: 694 },
                    { id: 924 }
                ],
                filtered_values: [
                    { id: 694 },
                    { id: 924 }
                ]
            };
            var target_field_value = [694];
            var field_dependencies_rules = [
                {
                    source_field_id: 65,
                    source_value_id: 478,
                    target_field_id: 58,
                    target_value_id: 924
                }
            ];
            TuleapArtifactModalFieldDependenciesService.getTargetFieldPossibleValues.and.returnValue([
                { id: 924 }
            ]);
            var modal_model = controller_params.modal_model;
            modal_model.tracker = {
                fields: [
                    target_field
                ],
                workflow: {
                    rules: {
                        lists: field_dependencies_rules
                    }
                }
            };
            modal_model.values = {
                65: {
                    bind_value_ids: []
                },
                58: {
                    bind_value_ids: target_field_value
                }
            };

            TuleapArtifactModalController = $controller('TuleapArtifactModalController', controller_params);
            // First apply so the watcher takes into account the initial value
            $scope.$apply();

            modal_model.values[65].bind_value_ids.push(478);
            $scope.$apply();

            expect(TuleapArtifactModalFieldDependenciesService.getTargetFieldPossibleValues).toHaveBeenCalledWith(
                [478],
                target_field,
                field_dependencies_rules
            );
            expect(target_field.filtered_values).toEqual([
                { id: 924 }
            ]);
            expect(target_field_value).toEqual([924]);
        });

        it("and given there were two target values, when I change the source field's value, then the field dependencies service will be called to modify the target field and the target fields's value will be reset", function() {
            var target_field = {
                field_id: 47,
                values: [
                    { id: 412 },
                    { id: 157 }
                ],
                filtered_values: [
                    { id: 412 }
                ]
            };
            var target_field_value = [412];
            var field_dependencies_rules = [
                {
                    source_field_id: 51,
                    source_value_id: 780,
                    target_field_id: 47,
                    target_value_id: 412
                }, {
                    source_field_id: 51,
                    source_value_id: 780,
                    target_field_id: 47,
                    target_value_id: 157
                }
            ];
            TuleapArtifactModalFieldDependenciesService.getTargetFieldPossibleValues.and.returnValue([
                { id: 412 },
                { id: 157 }
            ]);
            var modal_model = controller_params.modal_model;
            modal_model.tracker = {
                fields: [
                    target_field
                ],
                workflow: {
                    rules: {
                        lists: field_dependencies_rules
                    }
                }
            };
            modal_model.values = {
                51: {
                    bind_value_ids: []
                },
                47: {
                    bind_value_ids: target_field_value
                }
            };

            TuleapArtifactModalController = $controller('TuleapArtifactModalController', controller_params);
            // First apply so the watcher takes into account the initial value
            $scope.$apply();

            modal_model.values[51].bind_value_ids.push(780);
            $scope.$apply();

            expect(TuleapArtifactModalFieldDependenciesService.getTargetFieldPossibleValues).toHaveBeenCalledWith(
                [780],
                target_field,
                field_dependencies_rules
            );
            expect(target_field.filtered_values).toEqual([
                { id: 412 },
                { id: 157 }
            ]);
            expect(target_field_value).toEqual([]);
        });
    });

    describe("", function() {
        beforeEach(function() {
            TuleapArtifactModalController = $controller('TuleapArtifactModalController', controller_params);
        });

        describe("searchUsers() -", function() {
            var field, search_request;
            beforeEach(function() {
                field = {
                    loading: false,
                    values: [
                        { id: 410, label: "undrag" }
                    ]
                };
                search_request = $q.defer();
                TuleapArtifactModalRestService.searchUsers.and.returnValue(search_request.promise);
            });

            it("Given an openlist field and a search query with 3 characters, when I search for all usernames containing the query, then the field's loading flag will be set to true, the REST route will be queried and when it responds, the field's loading flag will be set to false and the field's values will be replaced with the data from the REST endpoint", function() {
                TuleapArtifactModalController.searchUsers(field, "Blu");
                expect(field.loading).toBeTruthy();
                var results = [
                    { id: 296, label: "Blue" },
                    { id: 953, label: "Blurred" }
                ];
                search_request.resolve(results);
                $scope.$apply();

                expect(TuleapArtifactModalRestService.searchUsers).toHaveBeenCalledWith("Blu");
                expect(field.loading).toBeFalsy();
                expect(field.values).toEqual(results);
            });

            it("Given an openlist field and a search query with 2 characters, when I search for all usernames containing the query, then the field's values will be emptied and the REST route won't be called", function() {
                TuleapArtifactModalController.searchUsers(field, "Re");

                expect(TuleapArtifactModalRestService.searchUsers).not.toHaveBeenCalled();
                expect(field.loading).toBeFalsy();
                expect(field.values).toEqual([]);
            });
        });

        describe("showParentArtifactChoice() -", function() {
            beforeEach(function() {
                TuleapArtifactModalParentService.canChooseArtifactsParent.and.returnValue(true);
                TuleapArtifactModalController.tracker = {
                    parent: {
                        id: 64
                    }
                };
                TuleapArtifactModalController.parent = {
                    id: 154
                };
                TuleapArtifactModalController.parent_artifacts = [
                    { id: 629 }
                ];
            });

            it("Given that I can choose a parent artifact and given the list of possible parent artifacts wasn't empty, when I check if I show the parent artifact choice, then it will return true", function() {
                var result = TuleapArtifactModalController.showParentArtifactChoice();

                expect(TuleapArtifactModalParentService.canChooseArtifactsParent).toHaveBeenCalledWith(
                    { id: 64 },
                    { id: 154 }
                );
                expect(result).toBeTruthy();
            });

            it("Given that the list of possible parent artifacts was empty, when I check if I show the parent artifact choice, then it will return false", function() {
                TuleapArtifactModalController.parent_artifacts = [];

                var result = TuleapArtifactModalController.showParentArtifactChoice();

                expect(result).toBeFalsy();
            });

            it("Given that I cannot choose a parent artifact, when I check if I show the parent artifact choice, then it will return false", function() {
                TuleapArtifactModalParentService.canChooseArtifactsParent.and.returnValue(false);

                var result = TuleapArtifactModalController.showParentArtifactChoice();

                expect(result).toBeFalsy();
            });
        });

        describe("formatParentArtifactTitle() -", function() {
            it("Given a parent artifact, when I format the title of the artifact, then the tracker's label, the artifact's id and its title will be concatenated and returned", function() {
                var artifact = {
                    title: "forcipated",
                    id: 747,
                    uri: "artifacts/747",
                    tracker: {
                        id: 47,
                        uri: "trackers/47",
                        label: "flareboard"
                    }
                };

                var result = TuleapArtifactModalController.formatParentArtifactTitle(artifact);

                expect(result).toEqual("flareboard #747 - forcipated");
            });
        });

        describe("isDisabled() -", function() {
            describe("Given that the modal was opened in creation mode", function() {
                it("and given a field that had the 'create' permission, when I check if it is disabled, then it will return false", function() {
                    TuleapArtifactModalController.creation_mode = true;
                    var field = {
                        permissions: ["read", "update", "create"]
                    };

                    var result = TuleapArtifactModalController.isDisabled(field);

                    expect(result).toBe(false);
                });

                it("and given a field that didn't have the 'create' permission, when I check if it is disabled then it will return true", function() {
                    TuleapArtifactModalController.creation_mode = true;
                    var field = {
                        permissions: ["read", "update"]
                    };

                    var result = TuleapArtifactModalController.isDisabled(field);

                    expect(result).toBe(true);
                });
            });

            describe("Given that the modal was opened in edition mode", function() {
                it("and given a field that had the 'update' permission, when I check if it is disabled then it will return false", function() {
                    TuleapArtifactModalController.creation_mode = false;
                    var field = {
                        permissions: ["read", "update", "create"]
                    };

                    var result = TuleapArtifactModalController.isDisabled(field);

                    expect(result).toBe(false);
                });

                it("and given a field that didn't have the 'update' permission, when I check if it is disabled then it will return true", function() {
                    TuleapArtifactModalController.creation_mode = false;
                    var field = {
                        permissions: ["read", "create"]
                    };

                    var result = TuleapArtifactModalController.isDisabled(field);

                    expect(result).toBe(true);
                });
            });
        });
    });
});
