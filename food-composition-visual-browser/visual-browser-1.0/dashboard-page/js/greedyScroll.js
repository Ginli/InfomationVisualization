/**
 * Created by ginli on 2016/12/4.
 */

$.fn.extend({
    greedyScroll: function(sensitivity) {
        return this.each(function() {
            $(this).bind('mousewheel DOMMouseScroll', function(evt) {
                var delta;
                if (evt.originalEvent) {
                    delta = -evt.originalEvent.wheelDelta || evt.originalEvent.detail;
                }
                if (delta !== null) {
                    evt.preventDefault();
                    if (evt.type === 'DOMMouseScroll') {
                        delta = delta * (sensitivity ? sensitivity : 20);
                    }
                    return $(this).scrollTop(delta + $(this).scrollTop());
                }
            });
        });
    }
});