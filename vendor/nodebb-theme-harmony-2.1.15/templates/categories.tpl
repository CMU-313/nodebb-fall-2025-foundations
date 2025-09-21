<div data-widget-area="header">
	{{{ each widgets.header }}}
	{{widgets.header.html}}
	{{{ end }}}
</div>

<div class="categories flex-fill">
  <div class="d-flex align-items-center justify-content-between mb-2">

	<!-- CONCERN: Not supported for multiple langs -->
	<!-- SOURCE: Chatgpt -->
	<h3 class="fw-semibold mb-0">Categories</h3> 
    {{{ if allowCategoryCreation }}}
    <button id="btn-new-category" class="btn btn-primary btn-sm text-nowrap">
      <i class="fa fa-folder-plus"></i> Create New Category
    </button>
    {{{ end }}}
  </div>

  {{{ if pagination.pages.length }}}
  <!-- IMPORT partials/category/selector-dropdown-left.tpl -->
  {{{ end }}}

	<hr/>

	<ul class="categories-list list-unstyled" itemscope itemtype="http://www.schema.org/ItemList">
		{{{ each categories }}}
		<!-- IMPORT partials/categories/item.tpl -->
		{{{ end }}}
	</ul>

	<!-- IMPORT partials/paginator.tpl -->
</div>

<div data-widget-area="sidebar" class="col-lg-3 col-sm-12 {{{ if !widgets.sidebar.length }}}hidden{{{ end }}}">
	{{{ each widgets.sidebar }}}
	{{widgets.sidebar.html}}
	{{{ end }}}
</div>

<div data-widget-area="footer">
	{{{ each widgets.footer }}}
	{{widgets.footer.html}}
	{{{ end }}}
</div>