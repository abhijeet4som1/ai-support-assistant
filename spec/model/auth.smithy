$version: "2.0"

namespace assistant.api

structure User {
    @required
    id: Id
    @required
    username: ShortText
    @required
    displayName: ShortText
}

/// Short-lived access token (JWT, sent as Bearer) plus a long-lived, single-use refresh token.
/// Reusing a rotated refresh token revokes the whole session family.
structure TokenSet {
    @required
    accessToken: String
    @required
    accessExpiresAt: DateTime
    @required
    refreshToken: String
    @required
    refreshExpiresAt: DateTime
}

/// Exchange username + password for a token set. Public.
@auth([])
@http(method: "POST", uri: "/api/auth/login")
operation Login {
    input := {
        @required
        @length(min: 1, max: 100)
        username: String
        @required
        @length(min: 1, max: 200)
        password: String
    }
    output := {
        @required
        tokens: TokenSet
        @required
        user: User
    }
    errors: [UnauthorizedError]
}

/// Rotate a refresh token into a new token set. Public (the refresh token is the credential).
@auth([])
@http(method: "POST", uri: "/api/auth/refresh")
operation RefreshToken {
    input := {
        @required
        @length(min: 1, max: 512)
        refreshToken: String
    }
    output := {
        @required
        tokens: TokenSet
        @required
        user: User
    }
    errors: [UnauthorizedError]
}

/// Revoke the session family of a refresh token. Public; unknown tokens are ignored.
@auth([])
@idempotent
@http(method: "POST", uri: "/api/auth/logout")
operation Logout {
    input := {
        @required
        @length(min: 1, max: 512)
        refreshToken: String
    }
    output := {
        @required
        revoked: Boolean
    }
}

/// Returns the user identified by the bearer token.
@readonly
@http(method: "GET", uri: "/api/auth/me")
operation GetCurrentUser {
    output := {
        @required
        user: User
    }
}
