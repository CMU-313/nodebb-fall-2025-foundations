
(function (factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else if (typeof define === 'function' && define.amd) {
    define(factory);
  }
})(function () {
  function compiled(helpers, context, guard, iter, helper) {
    var __escape = helpers.__escape;
    var value = context;
    return (guard((context != null) ? context['canResolve'] : null) ?
        "\n<div class=\"btn-group resolved-tools\">\n<button class=\"btn btn-ghost btn-sm ff-secondary d-flex align-items-center gap-2 text-truncate\" component=\"topic/resolved\" data-resolved=\"" + 
          __escape(guard((context != null) ? context['resolved'] : null)) + 
          "\">\n<i component=\"topic/resolved/icon\" class=\"fa fa-fw " + 
          (guard((context != null) ? context['resolved'] : null) ?
            "fa-check-circle text-success" :
            "fa-question-circle text-warning") + 
          "\"></i>\n<span component=\"topic/resolved/text\" class=\"d-none d-md-inline fw-semibold text-truncate text-nowrap\">\n" + 
          (guard((context != null) ? context['resolved'] : null) ?
            "[[topic:mark-unresolved]]" :
            "[[topic:mark-resolved]]") + 
          "\n</span>\n</button>\n</div>\n" :
        "");
  }

  compiled.blocks = {
    
  };

  return compiled;
})
