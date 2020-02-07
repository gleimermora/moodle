<?php
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
 * Event observer used by the enrol_self plugin.
 *
 * @package enrol_self
 * @copyright Gleimer Mora <gleimermora@catalyst-au.net>
 * @license http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace enrol_self\local;

defined('MOODLE_INTERNAL') || die();

use core\event\course_updated;
use dml_exception;

/**
 * Class observer
 *
 * @package enrol_self
 * @copyright 2020 Gleimer Mora <gleimermora@catalyst-au.net>
 * @license http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class observer {

    /**
     * Never regenerate enrol key on course_updated.
     */
    const NEVER = 0;

    /**
     * Only regenerate enrol key if key it has not been used.
     */
    const IF_NOT_USED = 1;

    /**
     * Always generate an enrol key on course_updated.
     */
    const ALWAYS = 2;

    /**
     * Triggered when 'course_updated' event is triggered
     * @param course_updated $event
     * @throws dml_exception
     */
    public static function course_enrol_key_update(course_updated $event) {
        $data = $event->get_data();
        if (!self::can_regenerate($data['contextid'])) {
            return;
        }
        $templatetokens = get_config('enrol_self', 'coursekeytemplate');
        $updatedfields = $data['other']['updatedfields'] ?? [];
        $tokensfound = [];
        foreach ($updatedfields as $updatedfield => $value) {
            if (strpos($templatetokens, $updatedfield) !== false) {
                $tokensfound[] = $updatedfield;
            }
        }
        // Template tokens not updated.
        if (!empty($templatetokens) && empty($tokensfound)) {
            return;
        }
        $olddata = $data['other']['olddata'] ?? [];
        if (empty($olddata)) {
            return;
        }
        $plugin = enrol_get_plugin('self');
        $plugin->update_password_for_instance($olddata, $updatedfields);
    }

    /**
     * Checks if an enrol key can be regenerated.
     * @param int $contextid
     * @return bool
     * @throws dml_exception
     */
    private static function can_regenerate($contextid) {
        global $DB;

        $regenerate = (int)get_config('enrol_self', 'regenerate');
        if (self::NEVER === $regenerate) {
            return false;
        } else if (self::IF_NOT_USED === $regenerate) {
            $sql = 'SELECT COUNT(ra.id) AS rolecount
                      FROM {role_assignments} ra
                     WHERE ra.contextid = :contextid
                  GROUP BY ra.roleid';
            $result = $DB->get_records_sql($sql, ['contextid' => $contextid]);
            $object = end($result);
            return empty($object->rolecount);
        }
        return true;
    }
}
