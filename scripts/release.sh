#!/bin/bash
# ================================================================================
# Cosmere RPG Character Builder - Release Script
# Semantic Versioning Release Management
# ================================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Files to update version in
PACKAGE_JSON="$PROJECT_ROOT/package.json"
CHANGELOG="$PROJECT_ROOT/CHANGELOG.md"

# ================================================================================
# Helper Functions
# ================================================================================

print_header() {
    echo -e "\n${BLUE}══════════════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}══════════════════════════════════════════════════════════════════${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

get_current_version() {
    grep '"version"' "$PACKAGE_JSON" | head -1 | awk -F'"' '{print $4}'
}

# Parse semantic version components
parse_version() {
    local version=$1
    IFS='.' read -r MAJOR MINOR PATCH <<< "$version"
}

# Increment version based on type
increment_version() {
    local version=$1
    local type=$2
    
    parse_version "$version"
    
    case $type in
        major)
            MAJOR=$((MAJOR + 1))
            MINOR=0
            PATCH=0
            ;;
        minor)
            MINOR=$((MINOR + 1))
            PATCH=0
            ;;
        patch)
            PATCH=$((PATCH + 1))
            ;;
        *)
            print_error "Invalid version type: $type"
            exit 1
            ;;
    esac
    
    echo "$MAJOR.$MINOR.$PATCH"
}

# Update version in package.json
update_package_json() {
    local new_version=$1
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s/\"version\": \"[^\"]*\"/\"version\": \"$new_version\"/" "$PACKAGE_JSON"
    else
        # Linux
        sed -i "s/\"version\": \"[^\"]*\"/\"version\": \"$new_version\"/" "$PACKAGE_JSON"
    fi
    
    print_success "Updated package.json to version $new_version"
}

# Update CHANGELOG.md
update_changelog() {
    local new_version=$1
    local release_date=$(date +%Y-%m-%d)
    
    # Replace [Unreleased] with new version header
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s/## \[Unreleased\]/## [Unreleased]\n\n### Added\n- Nothing yet\n\n### Changed\n- Nothing yet\n\n### Fixed\n- Nothing yet\n\n---\n\n## [$new_version] - $release_date/" "$CHANGELOG"
    else
        sed -i "s/## \[Unreleased\]/## [Unreleased]\n\n### Added\n- Nothing yet\n\n### Changed\n- Nothing yet\n\n### Fixed\n- Nothing yet\n\n---\n\n## [$new_version] - $release_date/" "$CHANGELOG"
    fi
    
    print_success "Updated CHANGELOG.md with version $new_version"
}

# Create git tag and commit
create_release_commit() {
    local new_version=$1
    
    cd "$PROJECT_ROOT"
    
    # Check for uncommitted changes outside of version files
    if ! git diff --quiet --exit-code -- . ':!package.json' ':!CHANGELOG.md'; then
        print_warning "You have uncommitted changes. Please commit or stash them first."
        git status --short
        read -p "Continue anyway? (y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
    
    # Stage version files
    git add package.json CHANGELOG.md
    
    # Commit
    git commit -m "chore(release): v$new_version"
    print_success "Created release commit"
    
    # Create annotated tag
    git tag -a "v$new_version" -m "Release v$new_version"
    print_success "Created git tag v$new_version"
}

# Push release to remote
push_release() {
    local new_version=$1
    
    read -p "Push release to origin? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git push origin main
        git push origin "v$new_version"
        print_success "Pushed release to origin"
    else
        print_warning "Skipped pushing. Run manually with:"
        echo "  git push origin main"
        echo "  git push origin v$new_version"
    fi
}

# Display usage information
show_usage() {
    echo "Usage: $0 [command] [options]"
    echo ""
    echo "Commands:"
    echo "  major          Bump major version (1.0.0 -> 2.0.0)"
    echo "  minor          Bump minor version (1.0.0 -> 1.1.0)"
    echo "  patch          Bump patch version (1.0.0 -> 1.0.1)"
    echo "  current        Show current version"
    echo "  help           Show this help message"
    echo ""
    echo "Options:"
    echo "  --dry-run      Show what would be done without making changes"
    echo "  --no-tag       Skip creating git tag"
    echo "  --no-push      Skip pushing to remote"
    echo ""
    echo "Examples:"
    echo "  $0 patch                  # Create a patch release"
    echo "  $0 minor --dry-run        # Preview minor release"
    echo "  $0 major --no-push        # Major release without pushing"
}

# ================================================================================
# Main Script
# ================================================================================

main() {
    local command=$1
    shift
    
    # Parse options
    local dry_run=false
    local no_tag=false
    local no_push=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --dry-run)
                dry_run=true
                shift
                ;;
            --no-tag)
                no_tag=true
                shift
                ;;
            --no-push)
                no_push=true
                shift
                ;;
            *)
                print_error "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done
    
    # Get current version
    local current_version=$(get_current_version)
    
    case $command in
        current)
            echo "Current version: $current_version"
            exit 0
            ;;
        help|--help|-h|"")
            show_usage
            exit 0
            ;;
        major|minor|patch)
            # Continue with release
            ;;
        *)
            print_error "Unknown command: $command"
            show_usage
            exit 1
            ;;
    esac
    
    # Calculate new version
    local new_version=$(increment_version "$current_version" "$command")
    
    print_header "Cosmere RPG Character Builder - Release"
    echo "Current version: $current_version"
    echo "New version:     $new_version"
    echo "Release type:    $command"
    echo ""
    
    if $dry_run; then
        print_warning "DRY RUN - No changes will be made"
        echo ""
        echo "Would perform the following actions:"
        echo "  1. Update package.json version to $new_version"
        echo "  2. Update CHANGELOG.md with version $new_version"
        if ! $no_tag; then
            echo "  3. Create git commit: chore(release): v$new_version"
            echo "  4. Create git tag: v$new_version"
        fi
        if ! $no_push; then
            echo "  5. Push commit and tag to origin"
        fi
        exit 0
    fi
    
    # Confirm release
    read -p "Proceed with release? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_warning "Release cancelled"
        exit 0
    fi
    
    echo ""
    
    # Perform release steps
    update_package_json "$new_version"
    update_changelog "$new_version"
    
    if ! $no_tag; then
        create_release_commit "$new_version"
    fi
    
    if ! $no_push && ! $no_tag; then
        push_release "$new_version"
    fi
    
    echo ""
    print_header "Release v$new_version Complete!"
    echo "Next steps:"
    echo "  1. Review the CHANGELOG.md and add release notes"
    echo "  2. GitHub Actions will build and push the Docker image"
    echo "  3. Watchtower will automatically deploy to production"
}

main "$@"
