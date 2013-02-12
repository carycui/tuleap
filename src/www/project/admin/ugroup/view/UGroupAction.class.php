<?php
/**
 * Copyright (c) Enalean, 2013. All Rights Reserved.
 *
 * This file is a part of Tuleap.
 *
 * Tuleap is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Tuleap is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Tuleap; if not, write to the Free Software
 * Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA
 */

require_once 'Binding.class.php';

class Project_Admin_UGroup_View_UGroupAction extends Project_Admin_UGroup_View_Binding {

    private $ldapUserGroupManager;

    public function __construct($ugroup, $ldapUserGroupManager, $request, $bindOption, $synchro) {
        $this->ldapUserGroupManager = $ldapUserGroupManager;
        $this->request = $request;
        $this->ugroup = $ugroup;
        $this->bindOption = $bindOption;
        $this->synchro = $synchro;
    }

    public function getContent() {

        $content = '';

        // Display to user what will be done with Ugroup members.
        //

        $toRemove    = $this->ldapUserGroupManager->getUsersToBeRemoved($this->bindOption);
        $toAdd       = $this->ldapUserGroupManager->getUsersToBeAdded($this->bindOption);
        $notImpacted = $this->ldapUserGroupManager->getUsersNotImpacted($this->bindOption);

        $hp = Codendi_HTMLPurifier::instance();

        $btn_update = $GLOBALS['Language']->getText('plugin_ldap', 'ugroup_edit_btn_update');

        if(is_array($toAdd)) {
            // Display
            $um = UserManager::instance();

            $content .= '<h1>'.$GLOBALS['Language']->getText('plugin_ldap','ugroup_members_synchro_title').'</h1>';
            $content .= '<p>'.$GLOBALS['Language']->getText('plugin_ldap', 'ugroup_members_synchro_warning').'</p>';
            $content .= '<p>'.$GLOBALS['Language']->getText('plugin_ldap', 'group_members_synchro_sumup', array(count($toRemove), count($toAdd), count($notImpacted))).'</p>';

            $content .= '<table width="100%">';
            $content .= '<tr><td width="50%" valign="top">';

            $content .= $GLOBALS['HTML']->box1_top($GLOBALS['Language']->getText('plugin_ldap', 'group_members_synchro_to_remove', array(count($toRemove))),0);
            $content .= '<ul>';
            foreach ($toRemove as $userId) {
                if (($user = $um->getUserById($userId))) {
                    $content .= '<li>'.$user->getRealName().' ('.$user->getUserName().')</li>';
                }
            }
            $content .= '</ul>';
            $content .= $GLOBALS['HTML']->box1_bottom(0);

            $content .= '</td><td width="50%"  valign="top">';

            $content .= $GLOBALS['HTML']->box1_top($GLOBALS['Language']->getText('plugin_ldap', 'group_members_synchro_to_add', array(count($toAdd))),0);
            $content .= '<ul>';
            foreach ($toAdd as $userId) {
                if (($user = $um->getUserById($userId))) {
                    $content .= '<li>'.$user->getRealName().' ('.$user->getUserName().')</li>';
                }
            }
            $content .= '</ul>';
            $content .= $GLOBALS['HTML']->box1_bottom(0);

            $content .= '</tr></td>';
            $content .= '<tr><td colspan="2" align="center">';
            $content .= '<form method="post" action="?ugroup_id='.$this->ugroup->getId().'&func=bind_with_group">';
            $content .= '<input type="hidden" name="bind_with_group" value="'.$hp->purify($this->request->get('bind_with_group')).'" />';
            $content .= '<input type="hidden" name="confirm" value="yes" />';
            if($this->bindOption == 'preserve_members') {
                $content .= '<input type="hidden" name="preserve_members" value="on" />';
            }
            if($this->synchro == LDAP_GroupManager::AUTO_SYNCHRONIZATION) {
                $content .= '<input type="hidden" name="synchronize" value="on" />';
            }
            $content .= '<input type="hidden" name="action" value="edit_directory" />';
            $content .= '<input type="submit" name="cancel" value="'.$GLOBALS['Language']->getText('global', 'btn_cancel').'" />';
            $content .= '<input type="submit" name="submit" value="'.$btn_update.'" />';
            $content .= '</form>';
            $content .= '</td></tr>';
            $content .= '</table>';

            return $content;
        } else {
          /*  $GLOBALS['Response']->addFeedback('error', $GLOBALS['Language']->getText('plugin_ldap', 'invalid_ldap_group_name'));
            $GLOBALS['Response']->redirect('/project/admin/index.php?group_id='.$group_id);*/
        }
    }
}

?>
