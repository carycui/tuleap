describe("TuleapArtifactModalWorkflowService", function() {
    var TuleapArtifactModalWorkflowService;

    beforeEach(function() {
        module('tuleap-artifact-modal-model');

        inject(function(_TuleapArtifactModalWorkflowService_) {
            TuleapArtifactModalWorkflowService = _TuleapArtifactModalWorkflowService_;
        });
    });

    describe("enforceWorkflowTransitions() -", function() {
        describe("Given a selected value, a selectbox field and a collection representing the workflow transitions", function() {
            it("when I enforce the workflow transitions, then the field's values will be only the available transitions value", function() {
                var field = {
                    field_id: 764,
                    permissions: ["read", "update", "create"],
                    type: "sb",
                    values: [
                        { id: 448 },
                        { id: 6 },
                        { id: 23 },
                        { id: 908 },
                        { id: 71 }
                    ]
                };
                var workflow = {
                    field_id: 764,
                    is_used: "1",
                    transitions: [
                        {
                            from_id: 448,
                            to_id: 6
                        }, {
                            from_id: 448,
                            to_id: 23
                        }, {
                            from_id: 908,
                            to_id: 71
                        }
                    ]
                };

                TuleapArtifactModalWorkflowService.enforceWorkflowTransitions(448, field, workflow);

                expect(field.values).toEqual([
                    { id: 448 },
                    { id: 6 },
                    { id: 23 }
                ]);
                expect(field.has_transitions).toBeTruthy();
            });
        });

    });
});
