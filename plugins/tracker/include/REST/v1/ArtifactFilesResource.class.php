<?php
/**
 * Copyright (c) Enalean, 2014. All Rights Reserved.
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

namespace Tuleap\Tracker\REST\v1;

use \Tuleap\REST\ProjectAuthorization;
use \Luracast\Restler\RestException;
use \Tracker_Artifact_Attachment_TemporaryFile           as TemporaryFile;
use \Tracker_Artifact_Attachment_TemporaryFileManager    as FileManager;
use \Tracker_Artifact_Attachment_TemporaryFileManagerDao as FileManagerDao;
use \Tuleap\Tracker\REST\Artifact\FileInfoRepresentation as FileInfoRepresentation;
use \Tracker_Artifact_Attachment_CannotCreateException   as CannotCreateException;
use \Tracker_Artifact_Attachment_FileTooBigException     as FileTooBigException;
use \Tracker_Artifact_Attachment_InvalidPathException    as InvalidPathException;
use \Tracker_Artifact_Attachment_MaxFilesException       as MaxFilesException;
use \Tracker_Artifact_Attachment_FileNotFoundException   as FileNotFoundException;
use \Tracker_Artifact_Attachment_InvalidOffsetException  as InvalidOffsetException;
use \Tracker_FileInfo_InvalidFileInfoException           as InvalidFileInfoException;
use \Tracker_FileInfo_UnauthorisedException              as UnauthorisedException;
use \Tuleap\Tracker\REST\Artifact\ArtifactFilesReference as ArtifactFilesReference;
use \Tuleap\REST\Header;
use \UserManager;
use \PFUser;
use \Tracker_ArtifactFactory;
use \Tracker_FormElementFactory;
use \Tracker_FileInfoFactory;
use \Tracker_FileInfoDao;
use \Tracker_REST_Artifact_ArtifactUpdater;
use \Tracker_REST_Artifact_ArtifactValidator;
use \Tracker_URLVerification;

class ArtifactFilesResource {
    /** @var Tracker_ArtifactFactory */
    private $artifact_factory;

    /** @var Tracker_FormElementFactory */
    private $formelement_factory;

    /** @var Tracker_FileInfoFactory */
    private $fileinfo_factory;

    public function __construct() {
        $this->artifact_factory    = Tracker_ArtifactFactory::instance();
        $this->formelement_factory = Tracker_FormElementFactory::instance();
        $this->fileinfo_factory    = new Tracker_FileInfoFactory(   new Tracker_FileInfoDao(),
                                                                    $this->formelement_factory,
                                                                    $this->artifact_factory
                                                                 );
    }

    /**
     * Create a temporary file
     *
     * Call this method to create a new file. To add new chunks, use PATCH on artifact_files/:ID
     *
     * @url POST
     * @param string $name          Name of the file {@from body}
     * @param string $description   Description of the file {@from body}
     * @param string $mimetype      Mime-Type of the file {@from body}
     * @param string $content       First chunk of the file (base64-encoded) {@from body}
     *
     * @return \Tuleap\Tracker\REST\Artifact\FileInfoRepresentation
     * @throws 500 406 403
     */
    protected function post($name, $description, $mimetype, $content) {

        $user         = UserManager::instance()->getCurrentUser();
        $file_manager = $this->getFileManager($user);

        $this->sendAllowHeadersForArtifactFile();

        try {
            $file         = $file_manager->save($name, $description, $mimetype);
            $chunk_offset = 1;
            $append       = $file_manager->appendChunkForREST($content, $file, $chunk_offset);
        } catch (CannotCreateException $e) {
            throw new RestException(500);
        } catch (FileTooBigException $e) {
            throw new RestException(406, 'Uploaded content exceeds maximum size of ' . FileManager::getMaximumFileChunkSize());
        } catch (InvalidPathException $e) {
            throw new RestException(500, $e->getMessage());
        } catch (MaxFilesException $e) {
            throw new RestException(403, 'Maximum number of temporary files reached: '. FileManager::TEMP_FILE_NB_MAX);
        }

        if (! $append) {
            throw new RestException(500);
        }

        return $this->buildFileRepresentation($file);
    }

    /**
     *
     * @param TemporaryFile $file
     * @return FileInfoRepresentation
     */
    private function buildFileRepresentation(TemporaryFile $file) {
        $reference = new FileInfoRepresentation();
        return $reference->build($file->getId(), $file->getCreatorId(), $file->getDescription(), $file->getName(), $file->getSize(), $file->getType());
    }

    /**
     * Append a chunk to a temporary file (not attached to any artifact)
     *
     * Use this method to append a chunk of file to any existing file created via POST on /artifact_files
     * <ol>
     *  <li>This method cannot be called on a file that is already referenced by an artifact
     *  </li>
     *  <li>The offset property is used by the server in order to detect error in the consistency of the data
     *      uploaded but it is not possible to upload chunks in the wrong order
     *  </li>
     *  <li>Only the user who created the temporary artifact_file can modify and view that file until it is attached to an artifact
     *  </li>
     * </ol>
     *
     * @url PATCH {id}
     *
     * @param int    $id      The ID of the temporary artifact_file
     * @param string $content Chunk of the file (base64-encoded) {@from body}
     * @param int    $offset  Used to check that the chunk uploaded is the next one (minimum value is 2) {@from body}
     */
    protected function patchId($id, $content, $offset) {
        $this->sendAllowHeadersForArtifactFileId();

        $user         = UserManager::instance()->getCurrentUser();
        $file_manager = $this->getFileManager($user);

        if (! $file_manager->isFileIdTemporary($id)) {
            throw new RestException(404, 'File is not modifiable');
        }

        $file = $this->getFile($id, $user);

        try {
            $file_manager->appendChunkForREST($content, $file, $offset);
        } catch (InvalidOffsetException $e) {
            throw new RestException(406, 'Invalid offset received. Expected: '. ($file->getCurrentChunkOffset() +1));
        }

        return $this->buildFileRepresentation($file);
    }

    /**
     * @url OPTIONS
     */
    public function options() {
        $this->sendAllowHeadersForArtifactFile();
    }

    /**
     * @url OPTIONS {id}
     */
    public function optionsId($id) {
        $this->sendAllowHeadersForArtifactFileId();

        $user = UserManager::instance()->getCurrentUser();
        $this->getFile($id, $user);
    }

    /**
     *
     * @param int $id
     * @param FileManager $file_manager
     * @return TemporaryFile
     * @throws RestException
     */
    private function getFile($id, PFUser $user) {
        $file_manager = $this->getFileManager($user);

        try {
            $file = $file_manager->getFile($id);
        } catch (FileNotFoundException $e) {
            throw new RestException(404);
        }

        $this->checkFileBelongsToUser($file, $user);

        return $file;
    }

    private function checkFileBelongsToUser(TemporaryFile $file, PFUser $user) {
        $creator_id = $file->getCreatorId();
        if ($creator_id != $user->getId()) {
            throw new RestException(401, 'This file does not belong to you');
        }
    }

    /**
     * Delete a temporary file or a file attached to an artifact
     *
     * @url DELETE {id}
     *
     * @throws 500, 400
     *
     * @param string $id Id of the file
     */
    public function delete($id) {
        Header::allowOptionsDelete();
        try {
            if (! $this->isFileTemporary($id)) {
                $this->removeAttachedFile($id);
            } else {
                $this->removeTemporaryFile($id);
            }
        } catch (Tracker_FormElement_InvalidFieldException $exception) {
            throw new RestException(400, $exception->getMessage());
        } catch (Tracker_FileInfo_InvalidFileInfoException $exception) {
            throw new RestException(400, $exception->getMessage());
        } catch (Tracker_NoChangeException $exception) {
        // Do nothing
        } catch (Tracker_Exception $exception) {
            if ($GLOBALS['Response']->feedbackHasErrors()) {
                throw new RestException(500, $GLOBALS['Response']->getRawFeedback());
            }
            throw new RestException(500, $exception->getMessage());
        }
    }

    /**
     * @param PFUser $user
     * @return FileManager
     */
    private function getFileManager(PFUser $user) {
        return new FileManager(
            $user,
            new FileManagerDao()
        );
    }

    private function sendAllowHeadersForArtifactFile() {
        Header::allowOptionsPost();
        Header::sendMaxFileChunkSizeHeaders(FileManager::getMaximumFileChunkSize());
    }


    private function sendAllowHeadersForArtifactFileId() {
        Header::allowOptionsPatch();
        Header::sendMaxFileChunkSizeHeaders(FileManager::getMaximumFileChunkSize());
    }

    /**
     * @param int $id
     *
     * @return Tracker_Artifact
     */
    private function getArtifactByFileInfoId(PFUser $user, $fileinfo_id) {
        try {
            $artifact = $this->fileinfo_factory->getArtifactByFileInfoId($user, $fileinfo_id);
        } catch (Tracker_FileInfo_InvalidFileInfoException $e) {
            throw new RestException(404, $e->getMessage());
        } catch (UnauthorisedException $e) {
            throw new RestException(403, $e->getMessage());
        }

        if ($artifact) {
            ProjectAuthorization::userCanAccessProject($user, $artifact->getTracker()->getProject(), new Tracker_URLVerification());
            return $artifact;
        }
    }

    private function isFileTemporary($id) {
        $user         = UserManager::instance()->getCurrentUser();
        $file_manager = $this->getFileManager($user);
        return $file_manager->isFileIdTemporary($id);
    }

    private function removeAttachedFile($id) {
        $user     = UserManager::instance()->getCurrentUser();
        $artifact = $this->getArtifactByFileInfoId($user, $id);
        $values   = $this->fileinfo_factory->getValuesForDeletionByFileInfoId($id);

        $updater = new Tracker_REST_Artifact_ArtifactUpdater(
            new Tracker_REST_Artifact_ArtifactValidator(
                $this->formelement_factory
            )
        );
        $updater->update($user, $artifact, $values);
    }

    private function removeTemporaryFile($id) {
        $user         = UserManager::instance()->getCurrentUser();
        $file         = $this->getFile($id, $user);
        $file_manager = $this->getFileManager($user);
        $file_manager->removeTemporaryFile($file);
    }

}
