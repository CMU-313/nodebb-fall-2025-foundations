{{{ if canResolve }}}
<div class="btn-group resolved-tools">
<button class="btn btn-ghost btn-sm ff-secondary d-flex align-items-center gap-2 text-truncate" component="topic/resolved" data-resolved="{resolved}">
<i component="topic/resolved/icon" class="fa fa-fw {{{ if resolved }}}fa-check-circle text-success{{{ else }}}fa-question-circle text-warning{{{ end }}}"></i>
<span component="topic/resolved/text" class="d-none d-md-inline fw-semibold text-truncate text-nowrap">
{{{ if resolved }}}[[topic:mark-unresolved]]{{{ else }}}[[topic:mark-resolved]]{{{ end }}}
</span>
</button>
</div>
{{{ end }}}