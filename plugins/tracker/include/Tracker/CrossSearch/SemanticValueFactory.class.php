<?php
/**
 * Copyright (c) Enalean, 2012. All Rights Reserved.
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
 * along with Tuleap. If not, see <http://www.gnu.org/licenses/>.
 */

/**
 * This factory provides a simple way to retrieve semantic values (e.g. title,
 * status...) given some artifact and changeset ids.
 * 
 * This didn't seem to be the point of the various existing factories in
 * Tracker/Semantic, that's why this class was written.
 * 
 * It was placed in the Tracker/CrossSearch namespace because it's the only
 * place where it is used for now.
 * 
 * Grouping the title and status retrieval in a same class is probably not the
 * best design, but it was the easier to start with.
 */
class Tracker_CrossSearch_SemanticValueFactory {
    public function getStatus($artifact_id, $changeset_id) {
        $artifact_factory = Tracker_ArtifactFactory::instance();
        $tracker          = $artifact_factory->getArtifactById($artifact_id)->getTracker();
        $value            = Tracker_Semantic_Status::load($tracker)->getField()->fetchChangesetValue($artifact_id, $changeset_id, null);
        
        return $value;
    }
}
?>
