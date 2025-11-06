import Vapor
import Fluent

struct HealthController: RouteCollection {
    func boot(routes: any RoutesBuilder) throws {
        routes.get("health", use: health)
    }

    @Sendable
    func health(req: Request) async throws -> HealthStatusResponse {
        var database = "supabase-only"

        // Only check PostgreSQL in development environment
        if req.application.environment == .development {
            do {
                _ = try await User.query(on: req.db).count()
                database = "ok"
            } catch {
                database = "unavailable"
                req.logger.error("Database health check failed: \(error.localizedDescription)")
            }
        }

        return HealthStatusResponse(status: "ok", database: database)
    }
}

struct HealthStatusResponse: Content {
    let status: String
    let database: String
}
