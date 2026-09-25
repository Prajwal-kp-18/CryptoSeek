#!/bin/bash
################################################################################
# Vestigo 
################################################################################
# This script installs ALL dependencies for the Vestigo firmware analysis and
# crypto-detection pipeline in a single unified virtual environment.
#
# Supported OS: Ubuntu/Debian, Fedora/RHEL, Arch Linux, macOS
# Requirements: sudo access, internet connection, ~10GB disk space
#
# Usage: ./setup.sh [OPTIONS]
#   --skip-ghidra       Skip Ghidra installation
#   --skip-containers   Skip container build
#   --skip-cross        Skip cross-compiler installation
#   --skip-ml           Skip ML/torch dependencies
#   --minimal           Minimal install (backend + qiling only)
#   --dry-run           Show what would be installed without doing it
#   -h, --help          Show this help message
################################################################################

set -e  # Exit on error

# =============================================================================
# CONFIGURATION
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VENV_DIR="${SCRIPT_DIR}/venv"
GHIDRA_VERSION="11.2.1"
GHIDRA_DATE="20241105"
GHIDRA_INSTALL_DIR="/opt/ghidra"
QILING_DIR="${SCRIPT_DIR}/qiling_analysis/qiling"
ROOTFS_DIR="${SCRIPT_DIR}/qiling_analysis/rootfs"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Parse command line arguments
SKIP_GHIDRA=false
SKIP_CONTAINERS=false
SKIP_CROSS=false
SKIP_ML=false
MINIMAL=false
DRY_RUN=false

for arg in "$@"; do
    case $arg in
        --skip-ghidra)
            SKIP_GHIDRA=true
            ;;
        --skip-containers)
            SKIP_CONTAINERS=true
            ;;
        --skip-cross)
            SKIP_CROSS=true
            ;;
        --skip-ml)
            SKIP_ML=true
            ;;
        --minimal)
            MINIMAL=true
            SKIP_GHIDRA=true
            SKIP_CONTAINERS=true
            SKIP_CROSS=true
            SKIP_ML=true
            ;;
        --dry-run)
            DRY_RUN=true
            ;;
        -h|--help)
            head -30 "$0" | tail -25
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $arg${NC}"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

print_header() {
    echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}

print_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

print_info() {
    echo -e "${CYAN}[*]${NC} $1"
}

detect_os() {
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        if [ -f /etc/os-release ]; then
            . /etc/os-release
            OS=$ID
        elif [ -f /etc/debian_version ]; then
            OS="debian"
        elif [ -f /etc/redhat-release ]; then
            OS="rhel"
        else
            OS="unknown"
        fi
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        OS="macos"
    else
        OS="unknown"
    fi
    echo $OS
}

check_command() {
    command -v "$1" &> /dev/null
}

run_cmd() {
    if [ "$DRY_RUN" = true ]; then
        echo -e "${YELLOW}[DRY-RUN]${NC} $*"
    else
        "$@"
    fi
}

# =============================================================================
# SYSTEM DEPENDENCIES
# =============================================================================

install_system_deps() {
    print_header "Installing System Dependencies"
    
    OS=$(detect_os)
    print_info "Detected OS: $OS"
    
    case $OS in
        ubuntu|debian|pop|linuxmint)
            print_info "Installing dependencies for Debian/Ubuntu..."
            run_cmd sudo apt-get update
            run_cmd sudo apt-get install -y \
                python3 \
                python3-pip \
                python3-venv \
                python3-dev \
                git \
                build-essential \
                cmake \
                pkg-config \
                wget \
                curl \
                strace \
                file \
                binutils \
                binwalk \
                libffi-dev \
                libssl-dev \
                liblzma-dev \
                liblzo2-dev \
                zlib1g-dev \
                libsqlite3-dev \
                libreadline-dev \
                libncurses5-dev \
                libncursesw5-dev \
                libmagic-dev \
                libbz2-dev \
                libxml2-dev \
                libxmlsec1-dev \
                xz-utils \
                tk-dev \
                yara \
                unzip \
                openjdk-17-jdk
            ;;
            
        fedora|rhel|centos|rocky|almalinux)
            print_info "Installing dependencies for Fedora/RHEL..."
            run_cmd sudo dnf install -y --skip-unavailable \
                python3 \
                python3-pip \
                python3-devel \
                git \
                gcc \
                gcc-c++ \
                make \
                cmake \
                pkg-config \
                wget \
                curl \
                strace \
                file \
                binutils \
                libffi-devel \
                openssl-devel \
                xz-devel \
                lzo-devel \
                zlib-devel \
                sqlite-devel \
                readline-devel \
                ncurses-devel \
                file-devel \
                bzip2-devel \
                libxml2-devel \
                xmlsec1-devel \
                tk-devel \
                yara \
                unzip \
                java-21-openjdk-devel || true
            ;;
            
        arch|manjaro|endeavouros)
            print_info "Installing dependencies for Arch Linux..."
            run_cmd sudo pacman -Sy --noconfirm \
                python \
                python-pip \
                git \
                base-devel \
                cmake \
                pkg-config \
                wget \
                curl \
                strace \
                file \
                binutils \
                libffi \
                openssl \
                xz \
                lzo \
                zlib \
                sqlite \
                readline \
                ncurses \
                bzip2 \
                libxml2 \
                xmlsec \
                tk \
                yara \
                unzip \
                jdk17-openjdk
            ;;
            
        macos)
            print_info "Installing dependencies for macOS..."
            if ! check_command brew; then
                print_error "Homebrew not found. Installing Homebrew..."
                /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
            fi
            
            run_cmd brew update
            run_cmd brew install \
                python@3.11 \
                git \
                cmake \
                pkg-config \
                wget \
                curl \
                libffi \
                openssl@3 \
                xz \
                lzo \
                zlib \
                sqlite \
                readline \
                ncurses \
                bzip2 \
                libxml2 \
                xmlsec1 \
                tk \
                yara \
                openjdk@17
            
            print_warning "Note: strace is not available on macOS"
            ;;
            
        *)
            print_error "Unsupported OS: $OS"
            print_warning "Please install dependencies manually. See README.md"
            exit 1
            ;;
    esac
    
    print_success "System dependencies installed"
}

# =============================================================================
# CONTAINER RUNTIME (PODMAN)
# =============================================================================

install_container_runtime() {
    print_header "Installing Container Runtime (Podman)"
    
    if check_command podman; then
        print_success "Podman is already installed: $(podman --version)"
        return
    fi
    
    if check_command docker; then
        print_warning "Docker found but Podman preferred. Using Docker as fallback."
        return
    fi
    
    OS=$(detect_os)
    
    case $OS in
        ubuntu|debian|pop|linuxmint)
            run_cmd sudo apt-get install -y podman
            ;;
        fedora|rhel|centos|rocky|almalinux)
            run_cmd sudo dnf install -y podman
            ;;
        arch|manjaro|endeavouros)
            run_cmd sudo pacman -Sy --noconfirm podman
            ;;
        macos)
            run_cmd brew install podman
            run_cmd podman machine init
            run_cmd podman machine start
            ;;
        *)
            print_warning "Could not install Podman automatically"
            ;;
    esac
    
    if check_command podman; then
        print_success "Podman installed: $(podman --version)"
    else
        print_warning "Podman installation may have failed. Container features may not work."
    fi
}

# =============================================================================
# PYTHON VIRTUAL ENVIRONMENT
# =============================================================================

setup_python_venv() {
    print_header "Setting Up Python Virtual Environment"
    
    # Check Python version
    if ! check_command python3; then
        print_error "Python 3 not found. Please install Python 3.9 or higher."
        exit 1
    fi
    
    PYTHON_VERSION=$(python3 --version | awk '{print $2}')
    print_info "Python version: $PYTHON_VERSION"
    
    # Check if version is at least 3.9
    MAJOR=$(echo $PYTHON_VERSION | cut -d. -f1)
    MINOR=$(echo $PYTHON_VERSION | cut -d. -f2)
    if [ "$MAJOR" -lt 3 ] || ([ "$MAJOR" -eq 3 ] && [ "$MINOR" -lt 9 ]); then
        print_error "Python 3.9 or higher is required. Current version: $PYTHON_VERSION"
        exit 1
    fi
    
    # Create virtual environment
    if [ -d "$VENV_DIR" ]; then
        print_warning "Virtual environment already exists at $VENV_DIR"
        print_info "Using existing virtual environment"
    else
        print_info "Creating virtual environment at $VENV_DIR..."
        run_cmd python3 -m venv "$VENV_DIR"
    fi
    
    # Activate virtual environment (skip in dry-run if venv doesn't exist)
    if [ "$DRY_RUN" = true ] && [ ! -f "$VENV_DIR/bin/activate" ]; then
        print_info "[DRY-RUN] Would activate venv at: $VENV_DIR/bin/activate"
        print_warning "[DRY-RUN] Skipping pip/python steps (venv not created in dry-run)"
        print_success "Virtual environment setup previewed"
        VENV_ACTIVE=false
        return
    fi
    
    source "$VENV_DIR/bin/activate"
    VENV_ACTIVE=true
    
    # Upgrade pip
    print_info "Upgrading pip, setuptools, wheel..."
    run_cmd pip install --upgrade pip setuptools wheel
    
    print_success "Virtual environment ready"
}

# =============================================================================
# PYTHON DEPENDENCIES
# =============================================================================

install_python_deps() {
    print_header "Installing Python Dependencies"
    
    # Skip if venv not active (dry-run without existing venv)
    if [ "$DRY_RUN" = true ] && [ ! -f "$VENV_DIR/bin/activate" ]; then
        print_info "[DRY-RUN] Would install Python packages in venv"
        print_success "Python dependencies installation previewed"
        return
    fi
    
    source "$VENV_DIR/bin/activate"
    
    # Install typing-extensions early with compatible version for all packages
    print_info "Installing typing-extensions..."
    run_cmd pip install 'typing_extensions==4.12.2'
    
    # Core web framework
    print_info "Installing FastAPI and web dependencies..."
    run_cmd pip install \
        'fastapi>=0.100.0' \
        'uvicorn[standard]>=0.23.0' \
        'python-multipart>=0.0.6' \
        'pydantic>=2.0.0' \
        'python-dotenv>=1.0.0' \
        'python-magic>=0.4.27' \
        'requests>=2.31.0'
    
    # Database
    print_info "Installing database dependencies..."
    run_cmd pip install 'prisma>=0.11.0'
    
    # ML and Data Science
    print_info "Installing ML and data science packages..."
    run_cmd pip install \
        'scikit-learn>=1.3.0' \
        'lightgbm>=4.0.0' \
        'pandas>=2.0.0' \
        'numpy>=1.24.0' \
        'joblib>=1.3.0'
    
    # Binary analysis core
    print_info "Installing binary analysis tools..."
    run_cmd pip install \
        'pyelftools>=0.28' \
        'capstone>=4.0.0' \
        'yara-python>=4.0.0' \
        'pycryptodome>=3.15.0' \
        'z3-solver>=4.11.0' \
        'binwalk'
    
    # Qiling dependencies
    print_info "Installing Qiling framework dependencies..."
    run_cmd pip install \
        'unicorn==2.1.3' \
        'keystone-engine>=0.9.2' \
        'pefile>=2022.5.30' \
        'python-registry>=1.3.1' \
        'gevent>=20.9.0' \
        'multiprocess>=0.70.12.2' \
        'pyyaml>=6.0.1' \
        'questionary' \
        'termcolor'
    
    # LLM integration
    print_info "Installing LLM integration..."
    run_cmd pip install 'openai>=1.0.0'
    
    # Additional utilities
    print_info "Installing additional utilities..."
    run_cmd pip install \
        'colorama>=0.4.6' \
        'tqdm>=4.65.0' \
        'rich>=13.0.0' \
        'loguru>=0.7.0'
    
    # Development tools
    print_info "Installing development tools..."
    run_cmd pip install \
        'pytest>=7.0.0' \
        'pytest-cov>=4.0.0' \
        'black>=22.0.0' \
        'flake8>=5.0.0' \
        'mypy>=0.990'
    
    # Optional ML dependencies (PyTorch for GNN) - CPU ONLY
    if [ "$SKIP_ML" = false ]; then
        print_info "Installing PyTorch (CPU) and GNN dependencies..."
        # Install CPU version of torch first to avoid huge CUDA downloads
        run_cmd pip install \
            'torch>=2.0.0' \
            'torchvision' \
            'torchaudio' \
            --index-url https://download.pytorch.org/whl/cpu
            
        run_cmd pip install \
            'torch-geometric>=2.3.0' \
            'matplotlib>=3.7.0' \
            'seaborn>=0.12.0' \
            'networkx>=2.6.0'
    fi
    
    print_success "Python dependencies installed"
}

# =============================================================================
# QILING FRAMEWORK
# =============================================================================

install_qiling() {
    print_header "Installing Qiling Framework"
    
    # Skip pip install in dry-run if venv doesn't exist
    if [ "$DRY_RUN" = true ] && [ ! -f "$VENV_DIR/bin/activate" ]; then
        print_info "[DRY-RUN] Would clone and install Qiling framework"
        print_success "Qiling installation previewed"
        return
    fi
    
    source "$VENV_DIR/bin/activate"
    
    # Clone Qiling if not exists
    if [ -d "$QILING_DIR" ]; then
        print_info "Qiling directory exists, pulling latest..."
        cd "$QILING_DIR"
        run_cmd git pull || print_warning "Could not pull latest Qiling updates"
        cd "$SCRIPT_DIR"
    else
        print_info "Cloning Qiling framework..."
        run_cmd git clone https://github.com/qilingframework/qiling.git "$QILING_DIR"
    fi
    
    # Install Qiling in editable mode
    print_info "Installing Qiling in editable mode..."
    run_cmd pip install -e "$QILING_DIR"
    
    # Clone rootfs if not exists or empty
    if [ -d "$ROOTFS_DIR" ]; then
        FILE_COUNT=$(find "$ROOTFS_DIR" -type f 2>/dev/null | wc -l)
        if [ "$FILE_COUNT" -gt 10 ]; then
            print_info "Rootfs directory exists and has $FILE_COUNT files"
        else
            print_warning "Rootfs directory exists but is incomplete, removing..."
            rm -rf "$ROOTFS_DIR"
            print_info "Cloning Qiling rootfs (shallow clone, this may take a while)..."
            mkdir -p "$(dirname "$ROOTFS_DIR")"
            if run_cmd git clone --depth 1 https://github.com/qilingframework/rootfs.git "$ROOTFS_DIR"; then
                print_success "Qiling rootfs cloned successfully"
            else
                print_error "Failed to clone Qiling rootfs"
                print_info "You can manually clone with: git clone --depth 1 https://github.com/qilingframework/rootfs.git $ROOTFS_DIR"
            fi
        fi
    else
        print_info "Cloning Qiling rootfs (shallow clone, this may take a while)..."
        mkdir -p "$(dirname "$ROOTFS_DIR")"
        if run_cmd git clone --depth 1 https://github.com/qilingframework/rootfs.git "$ROOTFS_DIR"; then
            print_success "Qiling rootfs cloned successfully"
        else
            print_error "Failed to clone Qiling rootfs"
            print_info "You can manually clone with: git clone --depth 1 https://github.com/qilingframework/rootfs.git $ROOTFS_DIR"
        fi
    fi
    
    # Fix typing-extensions conflict after Qiling installation
    # python-fx (Qiling dependency) pins typing-extensions==4.12.2
    # but pydantic needs >=4.14.1, so we uninstall python-fx and upgrade
    print_info "Fixing typing-extensions conflicts from python-fx..."
    run_cmd pip uninstall -y python-fx 2>/dev/null || true
    run_cmd pip install --force-reinstall 'typing-extensions>=4.14.1'
    
    print_success "Qiling framework installed"
}

# =============================================================================
# GHIDRA HEADLESS ANALYZER
# =============================================================================

install_ghidra() {
    print_header "Installing Ghidra Headless Analyzer"
    
    if [ -d "$GHIDRA_INSTALL_DIR" ] && [ -f "$GHIDRA_INSTALL_DIR/support/analyzeHeadless" ]; then
        print_success "Ghidra already installed at $GHIDRA_INSTALL_DIR"
        return
    fi
    
    # Check for Java
    if ! check_command java; then
        print_error "Java not found. Ghidra requires Java 17+."
        print_info "Please install OpenJDK 17 and re-run this script."
        return
    fi
    
    JAVA_VERSION=$(java -version 2>&1 | head -1 | cut -d'"' -f2 | cut -d'.' -f1)
    if [ "$JAVA_VERSION" -lt 17 ]; then
        print_warning "Java 17+ recommended. Current version: $JAVA_VERSION"
    fi
    
    # Download Ghidra
    GHIDRA_URL="https://github.com/NationalSecurityAgency/ghidra/releases/download/Ghidra_${GHIDRA_VERSION}_build/ghidra_${GHIDRA_VERSION}_PUBLIC_${GHIDRA_DATE}.zip"
    GHIDRA_ZIP="/tmp/ghidra_${GHIDRA_VERSION}.zip"
    
    print_info "Downloading Ghidra ${GHIDRA_VERSION}..."
    run_cmd wget -O "$GHIDRA_ZIP" "$GHIDRA_URL"
    
    # Extract Ghidra
    print_info "Extracting Ghidra to $GHIDRA_INSTALL_DIR..."
    run_cmd sudo mkdir -p "$GHIDRA_INSTALL_DIR"
    run_cmd sudo unzip -q "$GHIDRA_ZIP" -d /opt/
    run_cmd sudo mv "/opt/ghidra_${GHIDRA_VERSION}_PUBLIC"/* "$GHIDRA_INSTALL_DIR/"
    run_cmd sudo rmdir "/opt/ghidra_${GHIDRA_VERSION}_PUBLIC"
    run_cmd rm "$GHIDRA_ZIP"
    
    # Make scripts executable
    run_cmd sudo chmod +x "$GHIDRA_INSTALL_DIR/support/analyzeHeadless"
    
    print_success "Ghidra installed to $GHIDRA_INSTALL_DIR"
}

# =============================================================================
# CROSS-COMPILER TOOLCHAINS
# =============================================================================

install_cross_compilers() {
    print_header "Installing Cross-Compiler Toolchains"
    
    OS=$(detect_os)
    
    case $OS in
        ubuntu|debian|pop|linuxmint)
            print_info "Installing cross-compiler binutils..."
            run_cmd sudo apt-get install -y \
                binutils-aarch64-linux-gnu \
                binutils-arm-linux-gnueabi \
                binutils-arm-linux-gnueabihf \
                binutils-mips-linux-gnu \
                binutils-mipsel-linux-gnu \
                gcc-aarch64-linux-gnu \
                gcc-arm-linux-gnueabi \
                gcc-arm-linux-gnueabihf \
                gcc-mips-linux-gnu
            ;;
            
        fedora|rhel|centos|rocky|almalinux)
            run_cmd sudo dnf install -y --skip-unavailable \
                binutils-aarch64-linux-gnu \
                binutils-arm-linux-gnu \
                binutils-mips-linux-gnu \
                gcc-aarch64-linux-gnu \
                gcc-arm-linux-gnu
            ;;
            
        arch|manjaro|endeavouros)
            run_cmd sudo pacman -Sy --noconfirm \
                aarch64-linux-gnu-binutils \
                arm-linux-gnueabihf-binutils
            ;;
            
        macos)
            print_warning "Cross-compilers for macOS require manual setup"
            print_info "Consider using Docker/Podman for cross-compilation"
            ;;
            
        *)
            print_warning "Cross-compiler installation not supported for $OS"
            ;;
    esac
    
    # Verify installation
    print_info "Verifying cross-compiler tools..."
    for tool in aarch64-linux-gnu-ld arm-linux-gnueabi-ld mips-linux-gnu-ld; do
        if check_command $tool; then
            print_success "$tool found"
        else
            print_warning "$tool not found"
        fi
    done
}

# =============================================================================
# CONTAINER BUILD (SASQUATCH)
# =============================================================================

build_containers() {
    print_header "Building Containers"
    
    # Determine container runtime
    if check_command podman; then
        CONTAINER_CMD="podman"
    elif check_command docker; then
        CONTAINER_CMD="docker"
    else
        print_error "No container runtime found. Skipping container build."
        return
    fi
    
    print_info "Using $CONTAINER_CMD as container runtime"
    
    # Build sasquatch container
    if [ -f "$SCRIPT_DIR/Containerfile" ]; then
        print_info "Building sasquatch_tool container..."
        run_cmd $CONTAINER_CMD build -t sasquatch_tool -f "$SCRIPT_DIR/Containerfile" "$SCRIPT_DIR"
        
        # Also tag it as firmware-extractor for backward compatibility
        if [ "$DRY_RUN" != true ]; then
            $CONTAINER_CMD tag sasquatch_tool firmware-extractor 2>/dev/null || true
            print_info "Tagged as both 'sasquatch_tool' and 'firmware-extractor'"
        fi
        
        print_success "sasquatch_tool container built"
    else
        print_warning "Containerfile not found at $SCRIPT_DIR/Containerfile"
    fi
    
    # Build cross-compiler container for factory
    if [ -f "$SCRIPT_DIR/factory/Dockerfile.builder" ]; then
        print_info "Building cross-compiler container..."
        run_cmd $CONTAINER_CMD build -t vestigo-builder -f "$SCRIPT_DIR/factory/Dockerfile.builder" "$SCRIPT_DIR/factory"
        print_success "vestigo-builder container built"
    fi
}

# =============================================================================
# ENVIRONMENT CONFIGURATION
# =============================================================================

setup_environment() {
    print_header "Setting Up Environment Configuration"
    
    # Create .env file if not exists
    if [ ! -f "$SCRIPT_DIR/.env" ]; then
        if [ -f "$SCRIPT_DIR/.env.example" ]; then
            print_info "Creating .env from .env.example..."
            cp "$SCRIPT_DIR/.env.example" "$SCRIPT_DIR/.env"
        else
            print_info "Creating .env file..."
            cat > "$SCRIPT_DIR/.env" << EOF
# Vestigo Environment Configuration
# Generated by setup.sh on $(date)

# ============================================================================
# REQUIRED: Database Configuration
# ============================================================================
# You MUST set a valid PostgreSQL connection string for the backend to work
# For NeonDB (recommended): postgresql://user:password@ep-xxx.neon.tech/vestigo?sslmode=require
# For local PostgreSQL: postgresql://postgres:password@localhost:5432/vestigo
DATABASE_URL=postgresql://user:password@localhost:5432/vestigo

# ============================================================================
# REQUIRED: OpenAI API Configuration (for LLM-assisted analysis)
# ============================================================================
# Get your API key from: https://platform.openai.com/api-keys
OPENAI_API_KEY=your_openai_api_key_here

# ============================================================================
# OPTIONAL: Perplexity API Configuration
# ============================================================================
PERPLEXITY_API_KEY=your_perplexity_api_key_here

# ============================================================================
# System Configuration (Auto-configured)
# ============================================================================
# Ghidra Installation Path
GHIDRA_HOME=${GHIDRA_INSTALL_DIR}

# Python Virtual Environment Directory
VENV_DIR=${VENV_DIR}

# Python path for imports (scripts directory)
PYTHONPATH=${SCRIPT_DIR}:${SCRIPT_DIR}/scripts:${SCRIPT_DIR}/backend
EOF
        fi
        print_success ".env file created"
    else
        print_info ".env file already exists"
    fi
    
    # Update .env with Ghidra path if installed
    if [ -d "$GHIDRA_INSTALL_DIR" ]; then
        if grep -q "^GHIDRA_HOME=" "$SCRIPT_DIR/.env"; then
            sed -i "s|^GHIDRA_HOME=.*|GHIDRA_HOME=${GHIDRA_INSTALL_DIR}|" "$SCRIPT_DIR/.env"
        fi
    fi
    
    # Add PYTHONPATH to .env for backend to find scripts
    if ! grep -q "^PYTHONPATH=" "$SCRIPT_DIR/.env" 2>/dev/null; then
        echo "" >> "$SCRIPT_DIR/.env"
        echo "# Python path for imports" >> "$SCRIPT_DIR/.env"
        echo "PYTHONPATH=${SCRIPT_DIR}:${SCRIPT_DIR}/scripts:${SCRIPT_DIR}/backend" >> "$SCRIPT_DIR/.env"
    fi
    
    # Initialize Prisma client (skip in dry-run without venv)
    if [ "$DRY_RUN" = true ] && [ ! -f "$VENV_DIR/bin/activate" ]; then
        print_info "[DRY-RUN] Would generate Prisma client"
    else
        print_info "Generating Prisma client..."
        source "$VENV_DIR/bin/activate"
    cd "$SCRIPT_DIR/backend"
        if [ -f "prisma/schema.prisma" ]; then
            run_cmd prisma generate || print_warning "Prisma generate failed. Set DATABASE_URL first."
        fi
        cd "$SCRIPT_DIR"
    fi
    
    print_success "Environment configuration complete"
}

# =============================================================================
# UPDATE ACTIVATION SCRIPT
# =============================================================================

create_activation_script() {
    print_header "Creating Activation Script"
    
    cat > "$SCRIPT_DIR/activate_vestigo.sh" << 'EOF'
#!/bin/bash
# Vestigo Environment Activation Script

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Activate Python virtual environment
if [ -f "$SCRIPT_DIR/venv/bin/activate" ]; then
    source "$SCRIPT_DIR/venv/bin/activate"
    echo "✓ Python virtual environment activated"
else
    echo "✗ Virtual environment not found. Run setup.sh first."
    exit 1
fi

# Set PYTHONPATH to include scripts directory and project root
export PYTHONPATH="$SCRIPT_DIR:$SCRIPT_DIR/scripts:$SCRIPT_DIR/backend:${PYTHONPATH:-}"
echo "✓ PYTHONPATH set: scripts, backend accessible"

# Set Ghidra path if installed
if [ -d "/opt/ghidra" ]; then
    export GHIDRA_HOME="/opt/ghidra"
    export PATH="$GHIDRA_HOME/support:$PATH"
    echo "✓ Ghidra path set: $GHIDRA_HOME"
fi

# Load environment variables
if [ -f "$SCRIPT_DIR/.env" ]; then
    export $(grep -v '^#' "$SCRIPT_DIR/.env" | xargs)
    echo "✓ Environment variables loaded from .env"
fi

# Show status
echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  Vestigo Environment Ready!"
echo "═══════════════════════════════════════════════════════════"
echo "Python:    $(python --version)"
echo "Pip:       $(pip --version | cut -d' ' -f1-2)"
echo "Directory: $SCRIPT_DIR"
echo ""
echo "Quick commands:"
echo "  Backend:   cd backend && uvicorn main:app --reload"
echo "  Frontend:  cd frontend && npm run dev"
echo "  Ghidra:    analyzeHeadless --help"
echo ""
echo "To deactivate: deactivate"
echo "═══════════════════════════════════════════════════════════"
EOF
    
    chmod +x "$SCRIPT_DIR/activate_vestigo.sh"
    print_success "Activation script created: activate_vestigo.sh"
}

# =============================================================================
# VERIFICATION
# =============================================================================

verify_installation() {
    print_header "Verifying Installation"
    
    # Skip verification in dry-run if venv doesn't exist
    if [ "$DRY_RUN" = true ] && [ ! -f "$VENV_DIR/bin/activate" ]; then
        print_info "[DRY-RUN] Would verify installation"
        print_success "Dry-run complete - no actual changes were made"
        return 0
    fi
    
    source "$VENV_DIR/bin/activate"
    
    ALL_OK=true
    
    # Check Python modules
    print_info "Checking Python modules..."
    
    # Map display names to actual import names (some packages have different import names)
    declare -A MODULE_MAP=(
        ["fastapi"]="fastapi"
        ["prisma"]="prisma"
        ["pandas"]="pandas"
        ["sklearn"]="sklearn"
        ["lightgbm"]="lightgbm"
        ["pyelftools"]="elftools"
        ["capstone"]="capstone"
        ["yara"]="yara"
        ["pycryptodome"]="Crypto"
        ["qiling"]="qiling"
    )
    
    MODULES=("fastapi" "prisma" "pandas" "sklearn" "lightgbm" "pyelftools" "capstone" "yara" "pycryptodome" "qiling")
    
    for module in "${MODULES[@]}"; do
        # Get the actual import name (may differ from package name)
        import_name="${MODULE_MAP[$module]}"
        if [ -z "$import_name" ]; then
            import_name="$module"
        fi
        
        ERROR_MSG=$(python3 -c "import $import_name" 2>&1)
        if [ $? -eq 0 ]; then
            print_success "$module"
        else
            print_error "$module NOT installed or import failed"
            if [ ! -z "$ERROR_MSG" ]; then
                echo "    Error: $ERROR_MSG" | head -n 3
            fi
            ALL_OK=false
        fi
    done
    
    # Check Ghidra
    if [ "$SKIP_GHIDRA" = false ]; then
        print_info "Checking Ghidra..."
        if [ -f "$GHIDRA_INSTALL_DIR/support/analyzeHeadless" ]; then
            print_success "Ghidra headless analyzer found"
        else
            print_warning "Ghidra headless analyzer not found"
        fi
    fi
    
    # Check containers
    if [ "$SKIP_CONTAINERS" = false ]; then
        print_info "Checking containers..."
        if check_command podman; then
            if podman image exists sasquatch_tool 2>/dev/null; then
                print_success "sasquatch_tool container exists"
            else
                print_warning "sasquatch_tool container not built"
            fi
        elif check_command docker; then
            if docker image inspect sasquatch_tool >/dev/null 2>&1; then
                print_success "sasquatch_tool container exists"
            else
                print_warning "sasquatch_tool container not built"
            fi
        fi
    fi
    
    # Check rootfs
    print_info "Checking Qiling rootfs..."
    if [ -d "$ROOTFS_DIR" ]; then
        FILE_COUNT=$(find "$ROOTFS_DIR" -type f 2>/dev/null | wc -l)
        if [ "$FILE_COUNT" -gt 10 ]; then
            print_success "Qiling rootfs populated ($FILE_COUNT files)"
        else
            print_warning "Qiling rootfs exists but seems incomplete ($FILE_COUNT files)"
            print_info "Try: git clone --depth 1 https://github.com/qilingframework/rootfs.git $ROOTFS_DIR"
        fi
    else
        print_warning "Qiling rootfs directory not found: $ROOTFS_DIR"
        ALL_OK=false
    fi
    
    if [ "$ALL_OK" = true ]; then
        return 0
    else
        return 1
    fi
}

# =============================================================================
# PRINT FINAL INSTRUCTIONS
# =============================================================================

print_final_instructions() {
    print_header "Setup Complete!"
    
    cat << EOF
${GREEN}Installation successful!${NC}

${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}
${CYAN}Quick Start:${NC}
${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}

  1. Activate the environment:
     ${YELLOW}source activate_vestigo.sh${NC}
     
  2. Configure your .env file:
     ${YELLOW}nano .env${NC}
     ${RED}REQUIRED:${NC} Set your DATABASE_URL (PostgreSQL connection string)
     ${RED}REQUIRED:${NC} Set your OPENAI_API_KEY
     ${YELLOW}OPTIONAL:${NC} Set your PERPLEXITY_API_KEY
     
  3. Run the backend:
     ${YELLOW}cd backend && uvicorn main:app --reload${NC}
     
  4. Run the frontend (separate terminal):
     ${YELLOW}cd frontend && npm install && npm run dev${NC}

${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}
${CYAN}Installed Components:${NC}
${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}

  Python venv:     ${YELLOW}${VENV_DIR}${NC}
  Ghidra:          ${YELLOW}${GHIDRA_INSTALL_DIR}${NC}
  Qiling:          ${YELLOW}${QILING_DIR}${NC}
  Rootfs:          ${YELLOW}${ROOTFS_DIR}${NC}
  
${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}
${CYAN}Available Commands:${NC}
${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}

  ${GREEN}Backend API:${NC}
    cd backend && uvicorn main:app --reload --host 0.0.0.0 --port 8000
    
  ${GREEN}Static Analysis (Ghidra):${NC}
    python3 scripts/analyzer.py <binary>
    
  ${GREEN}Dynamic Analysis (Qiling):${NC}
    python3 qiling_analysis/tests/verify_crypto.py <binary>
    
  ${GREEN}Generate Dataset:${NC}
    python3 scripts/generate_dataset.py --input-dir ghidra_output --output dataset.csv

${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}

${YELLOW}Note: Remember to edit .env with your API keys and database URL!${NC}

EOF
}

# =============================================================================
# MAIN
# =============================================================================

main() {
    clear
    cat << "EOF"
 ██╗   ██╗███████╗███████╗████████╗██╗ ██████╗  ██████╗ 
 ██║   ██║██╔════╝██╔════╝╚══██╔══╝██║██╔════╝ ██╔═══██╗
 ██║   ██║█████╗  ███████╗   ██║   ██║██║  ███╗██║   ██║
 ╚██╗ ██╔╝██╔══╝  ╚════██║   ██║   ██║██║   ██║██║   ██║
  ╚████╔╝ ███████╗███████║   ██║   ██║╚██████╔╝╚██████╔╝
   ╚═══╝  ╚══════╝╚══════╝   ╚═╝   ╚═╝ ╚═════╝  ╚═════╝ 
                                                         
  Firmware Analysis & Crypto Detection Pipeline
  Unified Setup Script v1.0
EOF
    echo ""
    
    print_info "Starting installation at $(date)"
    print_info "Installation directory: $SCRIPT_DIR"
    
    if [ "$DRY_RUN" = true ]; then
        print_warning "DRY RUN MODE - No changes will be made"
    fi
    
    echo ""
    
    # System dependencies
    install_system_deps
    
    # Container runtime
    if [ "$SKIP_CONTAINERS" = false ]; then
        install_container_runtime
    else
        print_warning "Skipping container runtime installation"
    fi
    
    # Python virtual environment
    setup_python_venv
    
    # Python dependencies
    install_python_deps
    
    # Qiling framework
    install_qiling
    
    # Ghidra
    if [ "$SKIP_GHIDRA" = false ]; then
        install_ghidra
    else
        print_warning "Skipping Ghidra installation"
    fi
    
    # Cross-compilers
    if [ "$SKIP_CROSS" = false ]; then
        install_cross_compilers
    else
        print_warning "Skipping cross-compiler installation"
    fi
    
    # Container build
    if [ "$SKIP_CONTAINERS" = false ]; then
        build_containers
    else
        print_warning "Skipping container build"
    fi
    
    # Environment configuration
    setup_environment
    
    # Create activation script
    create_activation_script
    
    # Verification
    if verify_installation; then
        print_final_instructions
        exit 0
    else
        print_error "Some checks failed. Please review the output above."
        print_final_instructions
        exit 1
    fi
}

# =============================================================================
# RUN
# =============================================================================

main "$@"
