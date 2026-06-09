"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mergeMutationEvents = void 0;
var tslib_1 = require("tslib");
var rrweb_types_1 = require("@amplitude/rrweb-types");
function isMergeableMutation(event) {
    if (event.type !== rrweb_types_1.EventType.IncrementalSnapshot)
        return false;
    var data = event.data;
    return data.source === rrweb_types_1.IncrementalSource.Mutation && !data.isAttachIframe;
}
function mergeGroup(events) {
    var e_1, _a, e_2, _b;
    var first = events[0];
    // Track first/last event index for each node's adds and removes.
    // lastParentById: final parent from most recent add (last-write-wins).
    var firstAddEventIndex = new Map();
    var lastAddEventIndex = new Map();
    var firstRemoveEventIndex = new Map();
    var lastRemoveEventIndex = new Map();
    var lastParentById = new Map();
    events.forEach(function (e, i) {
        var e_3, _a, e_4, _b;
        var data = e.data;
        try {
            for (var _c = tslib_1.__values(data.adds), _d = _c.next(); !_d.done; _d = _c.next()) {
                var add = _d.value;
                if (!firstAddEventIndex.has(add.node.id))
                    firstAddEventIndex.set(add.node.id, i);
                lastAddEventIndex.set(add.node.id, i);
                lastParentById.set(add.node.id, add.parentId);
            }
        }
        catch (e_3_1) { e_3 = { error: e_3_1 }; }
        finally {
            try {
                if (_d && !_d.done && (_a = _c.return)) _a.call(_c);
            }
            finally { if (e_3) throw e_3.error; }
        }
        try {
            for (var _e = tslib_1.__values(data.removes), _f = _e.next(); !_f.done; _f = _e.next()) {
                var remove = _f.value;
                if (!firstRemoveEventIndex.has(remove.id))
                    firstRemoveEventIndex.set(remove.id, i);
                lastRemoveEventIndex.set(remove.id, i);
            }
        }
        catch (e_4_1) { e_4 = { error: e_4_1 }; }
        finally {
            try {
                if (_f && !_f.done && (_b = _e.return)) _b.call(_e);
            }
            finally { if (e_4) throw e_4.error; }
        }
    });
    // Classify nodes that appear in both adds and removes within this window:
    //
    // Pure transient:          created here (firstAddIdx < firstRemoveIdx) and ultimately removed
    //                          (lastAddIdx < lastRemoveIdx). Cancel all adds + all removes.
    //
    // Pre-existing transient:  pre-existed in DOM (firstRemoveIdx < firstAddIdx — removed before
    //                          first add), then re-added, then removed again (lastAddIdx < lastRemoveIdx).
    //                          The rrweb replayer processes all removes first: the re-add would still
    //                          execute after both removes, leaving the node present when it should be
    //                          absent. Fix: cancel the re-add and all post-add removes; keep only the
    //                          pre-add removes (they represent the legitimate removal from the original
    //                          location).
    var transientIds = new Set();
    var preExistingTransientIds = new Set();
    try {
        for (var firstAddEventIndex_1 = tslib_1.__values(firstAddEventIndex), firstAddEventIndex_1_1 = firstAddEventIndex_1.next(); !firstAddEventIndex_1_1.done; firstAddEventIndex_1_1 = firstAddEventIndex_1.next()) {
            var _c = tslib_1.__read(firstAddEventIndex_1_1.value, 2), id = _c[0], firstAddIdx = _c[1];
            var firstRemoveIdx = firstRemoveEventIndex.get(id);
            if (firstRemoveIdx === undefined)
                continue;
            var lastAddIdx = lastAddEventIndex.get(id);
            var lastRemoveIdx = lastRemoveEventIndex.get(id);
            if (lastAddIdx >= lastRemoveIdx)
                continue; // ultimately present — keep as-is
            if (firstAddIdx < firstRemoveIdx) {
                transientIds.add(id);
            }
            else if (firstRemoveIdx < firstAddIdx) {
                // firstRemoveIdx < firstAddIdx: pre-existing node removed, re-added, then removed again
                preExistingTransientIds.add(id);
            }
            // firstAddIdx === firstRemoveIdx: same-event move (remove+add in one rrweb event) followed
            // by a later remove — keep all operations so the move and final removal survive
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (firstAddEventIndex_1_1 && !firstAddEventIndex_1_1.done && (_a = firstAddEventIndex_1.return)) _a.call(firstAddEventIndex_1);
        }
        finally { if (e_1) throw e_1.error; }
    }
    // Cascade: nodes whose FINAL parent is effectively cancelled (transient or pre-existing-transient)
    // would be orphaned, so treat them as cancelled too.
    // Use lastParentById so a node moved away from a cancelled parent to a live one is not wrongly elided.
    //
    // Three cascade outcomes mirror the main-loop classification:
    //   transientIds:            no pre-existing removes (node created in window), or no remove/add overlap
    //   preExistingTransientIds: nodeFirstRemoveIdx < nodeFirstAddIdx (pre-existing, removed before re-add)
    //   cascadeDropAddsOnlyIds:  nodeFirstRemoveIdx === nodeFirstAddIdx (same-event move to cancelled parent)
    //                            → drop adds but preserve removes from non-cancelled parents
    var cascadeDropAddsOnlyIds = new Set();
    if (transientIds.size > 0 || preExistingTransientIds.size > 0) {
        var changed = true;
        while (changed) {
            changed = false;
            try {
                for (var lastParentById_1 = (e_2 = void 0, tslib_1.__values(lastParentById)), lastParentById_1_1 = lastParentById_1.next(); !lastParentById_1_1.done; lastParentById_1_1 = lastParentById_1.next()) {
                    var _d = tslib_1.__read(lastParentById_1_1.value, 2), nodeId = _d[0], parentId = _d[1];
                    if (!transientIds.has(nodeId) &&
                        !preExistingTransientIds.has(nodeId) &&
                        !cascadeDropAddsOnlyIds.has(nodeId) &&
                        (transientIds.has(parentId) || preExistingTransientIds.has(parentId) || cascadeDropAddsOnlyIds.has(parentId))) {
                        var nodeFirstRemoveIdx = firstRemoveEventIndex.get(nodeId);
                        var nodeFirstAddIdx = firstAddEventIndex.get(nodeId);
                        if (nodeFirstRemoveIdx !== undefined &&
                            nodeFirstAddIdx !== undefined &&
                            nodeFirstRemoveIdx < nodeFirstAddIdx) {
                            preExistingTransientIds.add(nodeId);
                        }
                        else if (nodeFirstRemoveIdx !== undefined &&
                            nodeFirstAddIdx !== undefined &&
                            nodeFirstRemoveIdx === nodeFirstAddIdx) {
                            cascadeDropAddsOnlyIds.add(nodeId);
                        }
                        else {
                            transientIds.add(nodeId);
                        }
                        changed = true;
                    }
                }
            }
            catch (e_2_1) { e_2 = { error: e_2_1 }; }
            finally {
                try {
                    if (lastParentById_1_1 && !lastParentById_1_1.done && (_b = lastParentById_1.return)) _b.call(lastParentById_1);
                }
                finally { if (e_2) throw e_2.error; }
            }
        }
    }
    var needsFilter = transientIds.size > 0 || preExistingTransientIds.size > 0 || cascadeDropAddsOnlyIds.size > 0;
    // Build filtered removes by iterating per event so we know each remove's event index.
    // Pure transients:          drop all removes.
    // Pre-existing transients:  drop removes at eventIdx >= firstAddIdx (the cancelled re-add cycle);
    //                           keep removes at eventIdx < firstAddIdx (legitimate pre-window removal).
    // Cascade drop-adds-only:   keep removes from non-cancelled parents; drop removes from cancelled parents
    //                           (the cancelled parent is never added in the replay, so a remove from it
    //                           would reference a non-existent node in the replayer).
    var filteredRemoves = [];
    events.forEach(function (e, eventIdx) {
        var e_5, _a;
        try {
            for (var _b = tslib_1.__values(e.data.removes), _c = _b.next(); !_c.done; _c = _b.next()) {
                var r = _c.value;
                if (transientIds.has(r.id))
                    continue;
                if (preExistingTransientIds.has(r.id) && eventIdx >= firstAddEventIndex.get(r.id))
                    continue;
                if (cascadeDropAddsOnlyIds.has(r.id) &&
                    (transientIds.has(r.parentId) ||
                        preExistingTransientIds.has(r.parentId) ||
                        cascadeDropAddsOnlyIds.has(r.parentId)))
                    continue;
                filteredRemoves.push(r);
            }
        }
        catch (e_5_1) { e_5 = { error: e_5_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_5) throw e_5.error; }
        }
    });
    var allAdds = events.flatMap(function (e) { return e.data.adds; });
    var allTexts = events.flatMap(function (e) { return e.data.texts; });
    var allAttributes = events.flatMap(function (e) { return e.data.attributes; });
    var merged = {
        source: rrweb_types_1.IncrementalSource.Mutation,
        removes: filteredRemoves,
        adds: needsFilter
            ? allAdds.filter(function (a) {
                return !transientIds.has(a.node.id) &&
                    !preExistingTransientIds.has(a.node.id) &&
                    !cascadeDropAddsOnlyIds.has(a.node.id);
            })
            : allAdds,
        texts: needsFilter
            ? allTexts.filter(function (t) { return !transientIds.has(t.id) && !preExistingTransientIds.has(t.id) && !cascadeDropAddsOnlyIds.has(t.id); })
            : allTexts,
        attributes: needsFilter
            ? allAttributes.filter(function (a) { return !transientIds.has(a.id) && !preExistingTransientIds.has(a.id) && !cascadeDropAddsOnlyIds.has(a.id); })
            : allAttributes,
    };
    return tslib_1.__assign(tslib_1.__assign({}, first), { data: merged });
}
/**
 * Merges consecutive IncrementalSnapshot mutation events into a single event,
 * reducing overall event count without changing replay semantics.
 *
 * isAttachIframe events are never merged — they carry a full iframe document
 * tree and must remain isolated.
 */
function mergeMutationEvents(events) {
    if (events.length <= 1)
        return events;
    var result = [];
    var i = 0;
    while (i < events.length) {
        if (!isMergeableMutation(events[i])) {
            result.push(events[i]);
            i++;
            continue;
        }
        var j = i + 1;
        while (j < events.length && isMergeableMutation(events[j])) {
            j++;
        }
        result.push(j > i + 1 ? mergeGroup(events.slice(i, j)) : events[i]);
        i = j;
    }
    return result;
}
exports.mergeMutationEvents = mergeMutationEvents;
//# sourceMappingURL=merge-mutation-events.js.map