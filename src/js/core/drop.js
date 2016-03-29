import $ from 'jquery';
import {isWithin, hasTouch, removeClass, getDimensions, toJQuery} from '../util/index';

export default function (UIkit) {

    var active;

    $(document).on('click', e => {
        if (active && !isWithin(e.target, active.$el) && !e.isDefaultPrevented()) {
            active.hide(true);
        }
    });

    UIkit.component('drop', {

        mixins: [UIkit.mixin.position, UIkit.mixin.toggable, UIkit.mixin.mouse],

        props: {
            mode: String,
            toggle: Boolean,
            boundary: 'jQuery',
            boundaryAlign: Boolean,
            delayShow: Number,
            delayHide: Number,
            clsDrop: String
        },

        defaults: {
            mode: 'hover',
            toggle: true,
            boundary: window,
            boundaryAlign: false,
            delayShow: 0,
            delayHide: 800,
            clsDrop: false,
            hoverIdle: 200,
            animation: 'uk-animation-fade',
            cls: 'uk-open'
        },

        ready() {

            this.clsDrop = this.clsDrop || 'uk-' + this.$options.name;
            this.clsPos = this.clsDrop;
            this.mode = hasTouch ? 'click' : this.mode;

            this.updateAria(this.$el);

            this.$el.on('click', `.${this.clsDrop}-close`, e => {
                e.preventDefault();
                this.hide(true)
            });

            if (this.mode === 'hover') {

                this.$el.on('mouseenter', () => {
                    if (this.isActive()) {
                        this.show()
                    }
                }).on('mouseleave', () => {
                    if (this.isActive()) {
                        this.hide();
                    }
                });

            }

            if (this.toggle) {
                this.toggle = typeof this.toggle === 'string' ? toJQuery(this.toggle) : this.$el.parent();

                if (this.toggle) {
                    UIkit.toggler(this.toggle, {target: this.$el});
                }
            }

        },

        update: {

            handler() {

                removeClass(this.$el, this.clsDrop + '-(stack|boundary)').css({top: '', left: '', width: '', height: ''});

                this.$el.toggleClass(`${this.clsDrop}-boundary`, this.boundaryAlign);

                this.dir = this.pos[0];
                this.align = this.pos[1];

                var boundary = getDimensions(this.boundary), alignTo = this.boundaryAlign ? boundary : getDimensions(this.toggle);

                if (this.align === 'justify') {
                    var prop = this.getAxis() === 'y' ? 'width' : 'height';
                    this.$el.css(prop, alignTo[prop]);
                } else if (this.$el.outerWidth() > Math.max(boundary.right - alignTo.left, alignTo.right - boundary.left)) {
                    this.$el.addClass(this.clsDrop + '-stack');
                    this.$el.trigger('stack', [this]);
                }

                this.positionAt(this.$el, this.boundaryAlign ? this.boundary : this.toggle, this.boundary);

            },

            events: ['resize', 'orientationchange']

        },

        methods: {

            show(force, toggle) {

                var animate = true;

                if (toggle !== this.toggle) {
                    this.hide(true);
                    animate = false;
                }

                this.toggle = toggle || this.toggle;

                this.clearTimers();

                if (this.isActive()) {
                    return;
                } else if (!force && active && active !== this && active.isDelaying) {
                    this.showTimer = setTimeout(this.show.bind(this), 75);
                    return;
                } else if (active) {
                    active.hide(true);
                }

                var show = () => {

                    this.$el.trigger('beforeshow', [this]);
                    this.toggleState(this.$el, animate, true);
                    this.$el.trigger('show', [this]);
                    this._callUpdate();

                    if (this.mode === 'hover') {
                        this.initMouseTracker();
                    }
                };

                if (!force && this.delayShow) {
                    this.showTimer = setTimeout(show, this.delayShow);
                } else {
                    show();
                }

                active = this;
            },

            hide(force) {

                this.clearTimers();

                var hide = () => {

                    if (!this.isActive()) {
                        return;
                    }

                    active = null;

                    this.cancelMouseTracker();

                    this.$el.trigger('beforehide', [this]);
                    this.toggleState(this.$el, false, false);
                    this.$el.trigger('hide', [this]);

                };

                this.isDelaying = this.movesTo(this.$el);

                if (!force && this.isDelaying) {
                    this.hideTimer = setTimeout(this.hide.bind(this), this.hoverIdle);
                } else if (!force && this.delayHide) {
                    this.hideTimer = setTimeout(hide, this.delayHide);
                } else {
                    hide();
                }
            },

            clearTimers() {
                clearTimeout(this.showTimer);
                clearTimeout(this.hideTimer);
            },

            isActive() {
                return active === this;
            }

        }

    });

    UIkit.drop.getActive = () => active;
}
