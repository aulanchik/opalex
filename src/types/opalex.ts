export interface OpenAlexWork {
    id: string;
    title: string;
    display_name: string;
    publication_year: number;
    publication_date: string;
    authorships: Array<{
        author: {
            id: string;
            display_name: string;
        };
        institutions: Array<{
            id: string;
            display_name: string;
            country_code: string;
        }>;
    }>;
    cited_by_count: number;
    concepts: Array<{
        id: string;
        display_name: string;
        level: number;
    }>;
    abstract_inverted_index?: Record<string, number[]>;
}

export interface OpenAlexAuthor {
    id: string;
    display_name: string;
    works_count: number;
    cited_by_count: number;
    last_known_institution: {
        id: string;
        display_name: string;
        country_code: string;
    };
    works_api_url: string;
}

export interface OpenAlexInstitution {
    id: string;
    display_name: string;
    country_code: string;
    type: string;
    works_count: number;
    cited_by_count: number;
}

export interface OpenAlexResponse {
    results: any[];
    meta: {
        count: number;
        db_response_time_ms: number;
        page: number;
        per_page: number;
    };
}
