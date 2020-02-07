// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.

/**
 * Generate Password functionality.
 *
 * @module     enrol_self/generatepassword
 * @package    enrol_self
 * @class      generatepassword
 * @copyright  2020 Gleimer Mora <gleimermora@catalyst-au.net>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 * @since      3.9
 */
define(['jquery', 'core/ajax', 'core/templates', 'core_form/passwordunmask'], function($, ajax, Template, PasswordUnmask) {

    /**
     * Constructor for GeneratePassword.
     *
     * @param {Number} id
     * @param {String} ctx
     * @constructor
     */
    var GeneratePassword = function(id, ctx) {
        this.wrapperSelector = '[data-passwordunmask="wrapper"]';
        this.wrapper = $(this.wrapperSelector);
        this.inputFieldId = this.wrapper.attr('data-passwordunmaskid');
        this.passwordUnMask = new PasswordUnmask(this.inputFieldId);
        var element = document.querySelectorAll('[data-passwordunmask="instructions"]');

        Template.render('enrol_self/element-generatepassword', {
            element: {id: id, context: ctx},
        })
        .then(function(html, js) {
            $(element).before(html);
            Template.runTemplateJS(js);
            return;
        })
        .fail();

        this.wrapper.on('click keypress', '[data-passwordunmask="generate"]', $.proxy(function(e) {
            if (e.type === 'keypress' && e.keyCode !== 13) {
                return;
            }
            e.stopImmediatePropagation();
            e.preventDefault();
            var id = e.currentTarget.getAttribute('data-generate');
            var ctx = e.currentTarget.getAttribute('data-context');
            if (id === 'undefined' || ctx === 'undefined') {
                return;
            }
            var passwordUnMask = this.passwordUnMask;
            this.generate(id, ctx).then(function(resp) {
                if (resp.warnings.length === 0) {
                    passwordUnMask.inputField.val(resp.key);
                    passwordUnMask.setDisplayValue();
                }
                return true;
            }).fail();
        }, this));
    };

    /**
     * Generate the random password.
     * @param {Number} id
     * @param {String} ctx
     * @returns {Promise}
     */
    GeneratePassword.prototype.generate = function(id, ctx) {
        var promise;
        promise = ajax.call([{
            methodname: 'enrol_self_generate_key',
            args: {id: id, ctx: ctx}
        }]);
        return promise[0];
    };

    return /** @alias module:enrol_self/generate */ {
        // Public variables and functions.

        /**
         * Initialise the actions helper.
         *
         * @method init
         * @param {Number} id
         * @param {String} context
         * @return {GeneratePassword}
         */
        init: function(id, context) {
            return new GeneratePassword(id, context);
        }
    };
});
