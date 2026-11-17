// @editor-only
// Animated files are decoded before the transaction writes its first destination. Metadata travels with
// that same plan into the index, so a successful drop is ready to slice and play immediately.
Object.assign(DocsDoodads.Workspace, {
    prepareAnimatedImport(plan, cancellationToken) {
        return DocsDoodads.AnimatedImport.preparePlan(plan, { cancellationToken });
    },
    animatedImportFailure(plan, prepared) {
        return {
            ok: false, imported: [], overwritten: [], duplicates: (plan.duplicates || []).slice(), skipped: (plan.skipped || []).slice(),
            unsupported: (plan.unsupported || []).slice(), errors: (prepared.errors || []).slice(), rolledBack: false,
            cancelled: prepared.cancelled === true, warnings: (prepared.warnings || []).slice()
        };
    }
});
