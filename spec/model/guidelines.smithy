$version: "2.0"

namespace assistant.api

/// Lifecycle of an uploaded guideline file.
enum GuidelineStatus {
    QUEUED = "queued"
    PARSING = "parsing"
    CHUNKING = "chunking"
    EMBEDDING = "embedding"
    READY = "ready"
    FAILED = "failed"
    /// Replaced by a newer upload before it finished.
    SUPERSEDED = "superseded"
}

structure GuidelineVersionSummary {
    @required
    id: Id
    @required
    companyId: Id
    @required
    filename: ShortText
    @required
    contentType: String
    @required
    sizeBytes: Integer
    @required
    status: GuidelineStatus
    @required
    chunksTotal: Integer
    @required
    chunksEmbedded: Integer
    error: String
    @required
    isActive: Boolean
    @required
    uploadedBy: User
    @required
    createdAt: DateTime
    @required
    updatedAt: DateTime
    readyAt: DateTime
    supersededBy: Id
}

list GuidelineVersionList {
    member: GuidelineVersionSummary
}

structure GuidelineChunk {
    @required
    id: Id
    @required
    ordinal: Integer
    title: String
    @required
    content: String
    @required
    tokenCount: Integer
}

list GuidelineChunkList {
    member: GuidelineChunk
}

@error("client")
@httpError(409)
structure GuidelinesNotReadyError {
    @required
    message: String
    @required
    companyId: Id
    latestStatus: GuidelineStatus
}

/// Another user uploaded guidelines after the client loaded the page.
@error("client")
@httpError(409)
structure GuidelinesConflictError {
    @required
    message: String
    @required
    latestVersionId: Id
    @required
    uploadedBy: User
    @required
    uploadedAt: DateTime
}

@error("client")
@httpError(413)
structure PayloadTooLargeError {
    @required
    message: String
    @required
    maxBytes: Integer
}

@error("client")
@httpError(415)
structure UnsupportedMediaTypeError {
    @required
    message: String
    @required
    supported: StringList
}

/// Raw uploaded guideline file bytes.
@mediaType("application/octet-stream")
blob GuidelineFile

/// Upload (or replace) the guideline file for a company. Processing is
/// asynchronous: returns 202 with the new version in `queued` status; poll
/// GetGuidelineVersion until it is `ready`, `failed` or `superseded`.
@idempotent
@http(method: "PUT", uri: "/api/companies/{companyId}/guidelines", code: 202)
operation UploadGuidelines {
    input := {
        @required
        @httpLabel
        companyId: Id
        /// Original file name (extension is used to pick the parser).
        @required
        @httpHeader("X-Filename")
        @length(min: 1, max: 255)
        filename: String
        /// Original MIME type as reported by the browser, if known.
        @httpHeader("X-File-Content-Type")
        fileContentType: String
        /// Id of the latest guideline version the client displayed. If a newer
        /// version exists the upload is rejected with GuidelinesConflictError.
        @httpHeader("X-Expected-Version")
        expectedVersionId: Id
        @required
        @httpPayload
        body: GuidelineFile
    }
    output := {
        @required
        version: GuidelineVersionSummary
    }
    errors: [
        NotFoundError
        GuidelinesConflictError
        PayloadTooLargeError
        UnsupportedMediaTypeError
    ]
}

/// The active guideline version with its extracted text and chunks.
@readonly
@http(method: "GET", uri: "/api/companies/{companyId}/guidelines")
operation GetActiveGuidelines {
    input := {
        @required
        @httpLabel
        companyId: Id
    }
    output := {
        @required
        version: GuidelineVersionSummary
        @required
        text: String
        @required
        chunks: GuidelineChunkList
    }
    errors: [NotFoundError, GuidelinesNotReadyError]
}

@readonly
@http(method: "GET", uri: "/api/companies/{companyId}/guidelines/versions")
operation ListGuidelineVersions {
    input := {
        @required
        @httpLabel
        companyId: Id
    }
    output := {
        @required
        items: GuidelineVersionList
    }
    errors: [NotFoundError]
}

/// Status + progress of one version. Poll while status is not terminal.
@readonly
@http(method: "GET", uri: "/api/guideline-versions/{versionId}")
operation GetGuidelineVersion {
    input := {
        @required
        @httpLabel
        versionId: Id
    }
    output := {
        @required
        version: GuidelineVersionSummary
    }
    errors: [NotFoundError]
}

/// Re-enqueue a failed version.
@idempotent
@http(method: "POST", uri: "/api/guideline-versions/{versionId}/retry")
operation RetryGuidelineVersion {
    input := {
        @required
        @httpLabel
        versionId: Id
    }
    output := {
        @required
        version: GuidelineVersionSummary
    }
    errors: [NotFoundError, ConflictError]
}

/// Make a `ready` version the active one (rollback / conflict resolution).
@idempotent
@http(method: "POST", uri: "/api/guideline-versions/{versionId}/activate")
operation ActivateGuidelineVersion {
    input := {
        @required
        @httpLabel
        versionId: Id
    }
    output := {
        @required
        version: GuidelineVersionSummary
    }
    errors: [NotFoundError, ConflictError]
}
