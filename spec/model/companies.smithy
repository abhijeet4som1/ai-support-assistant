$version: "2.0"

namespace assistant.api

structure Company {
    @required
    id: Id
    @required
    name: ShortText
    description: String
    /// Summary of the currently active (ready) guideline version, if any.
    activeGuidelines: GuidelineVersionSummary
    /// Latest version regardless of status (may be processing / failed).
    latestGuidelines: GuidelineVersionSummary
    @required
    conversationCount: Integer
    @required
    createdAt: DateTime
    @required
    updatedAt: DateTime
}

list CompanyList {
    member: Company
}

@readonly
@http(method: "GET", uri: "/api/companies")
operation ListCompanies {
    output := {
        @required
        items: CompanyList
    }
}

@idempotent
@http(method: "POST", uri: "/api/companies", code: 201)
operation CreateCompany {
    input := {
        @required
        @length(min: 1, max: 200)
        name: String
        @length(max: 1000)
        description: String
    }
    output := {
        @required
        company: Company
    }
    errors: [ConflictError]
}

@readonly
@http(method: "GET", uri: "/api/companies/{companyId}")
operation GetCompany {
    input := {
        @required
        @httpLabel
        companyId: Id
    }
    output := {
        @required
        company: Company
    }
    errors: [NotFoundError]
}

@idempotent
@http(method: "PATCH", uri: "/api/companies/{companyId}")
operation UpdateCompany {
    input := {
        @required
        @httpLabel
        companyId: Id
        @length(min: 1, max: 200)
        name: String
        @length(max: 1000)
        description: String
    }
    output := {
        @required
        company: Company
    }
    errors: [NotFoundError, ConflictError]
}
