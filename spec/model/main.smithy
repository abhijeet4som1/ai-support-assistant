$version: "2.0"

namespace assistant.api

use aws.protocols#restJson1
use smithy.framework#ValidationException

/// AI Support Assistant API.
///
/// Helps customer-support agents answer customer messages according to a
/// company's uploaded guidelines. Every operation except Login and Health
/// requires a bearer token obtained from Login.
@restJson1
@httpBearerAuth
@title("AI Support Assistant API")
@paginated(inputToken: "cursor", outputToken: "nextCursor", pageSize: "limit", items: "items")
service SupportAssistant {
    version: "2026-09-13"
    operations: [
        Health
        Login
        RefreshToken
        Logout
        GetCurrentUser
        ListCompanies
        CreateCompany
        GetCompany
        UpdateCompany
        UploadGuidelines
        GetActiveGuidelines
        ListGuidelineVersions
        GetGuidelineVersion
        RetryGuidelineVersion
        ActivateGuidelineVersion
        CreateConversation
        ListConversations
        GetConversation
        SendMessage
        SubmitFeedback
        ListCorrections
        UpdateCorrection
    ]
    errors: [
        ValidationException
        UnauthorizedError
        RateLimitedError
        InternalServerError
    ]
}

// ---------------------------------------------------------------------------
// Common shapes
// ---------------------------------------------------------------------------

/// ISO-8601 date-time (restJson1 would otherwise default to epoch seconds).
@timestampFormat("date-time")
timestamp DateTime

@length(min: 1, max: 64)
string Id

@length(min: 1, max: 200)
string ShortText

@length(min: 1, max: 20000)
string LongText

list StringList {
    member: String
}

/// Cursor for paginated list operations (opaque to clients).
@length(min: 1, max: 512)
string Cursor

@range(min: 1, max: 100)
integer PageSize

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

@error("client")
@httpError(401)
structure UnauthorizedError {
    @required
    message: String
}

@error("client")
@httpError(404)
structure NotFoundError {
    @required
    message: String
    resource: String
    id: String
}

/// Generic conflict (e.g. duplicate company name).
@error("client")
@httpError(409)
structure ConflictError {
    @required
    message: String
}

@error("client")
@httpError(429)
@retryable(throttling: true)
structure RateLimitedError {
    @required
    message: String
    retryAfterSeconds: Integer
}

/// The AI provider failed or timed out. Safe to retry.
@error("server")
@httpError(502)
@retryable
structure AiProviderError {
    @required
    message: String
    provider: String
}

@error("server")
@httpError(500)
structure InternalServerError {
    @required
    message: String
    requestId: String
}

// ---------------------------------------------------------------------------
// Health
// ---------------------------------------------------------------------------

/// Liveness probe. Public.
@readonly
@auth([])
@http(method: "GET", uri: "/api/health")
operation Health {
    output := {
        @required
        status: String
        @required
        service: String
        @required
        time: DateTime
    }
}
