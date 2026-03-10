#!/bin/bash

# --- CONFIGURATION ---
PROJECT_ID="project-ee236072-e4f5-4866-b68"
ZONE="us-central1-a"
INSTANCE_NAME="apex-bank-vm"
MACHINE_TYPE="e2-medium" # 2 vCPU, 4GB RAM - Recommended for building React
IMAGE_FAMILY="ubuntu-2204-lts"
IMAGE_PROJECT="ubuntu-os-cloud"
GEMINI_API_KEY="AIzaSyCNDC3MVzpTD20KN2H7-lFh7uPLE5RSQeA"

echo "🏗 Starting Full Infrastructure & App Deployment..."

# 1. Set the project
gcloud config set project $PROJECT_ID

# 2. Create the VM Instance
echo "🖥 Creating VM Instance: $INSTANCE_NAME..."
gcloud compute instances create $INSTANCE_NAME \
    --zone=$ZONE \
    --machine-type=$MACHINE_TYPE \
    --image-family=$IMAGE_FAMILY \
    --image-project=$IMAGE_PROJECT \
    --tags=http-server,apex-app

# 3. Create Firewall Rule for Port 3000
echo "🛡 Configuring Firewall for Port 3000..."
gcloud compute firewall-rules create allow-apex-app \
    --allow tcp:3000 \
    --target-tags=apex-app \
    --description="Allow port 3000 for Apex Bank App" || echo "Firewall rule already exists."

# 4. Wait for VM to be ready
echo "⏳ Waiting for VM to initialize (approx 30s)..."
sleep 30

# 5. Setup VM Environment (Node.js, PM2)
echo "🛠 Provisioning VM environment..."
gcloud compute ssh $INSTANCE_NAME --zone=$ZONE --command="
  sudo apt-get update
  curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
  sudo apt-get install -y nodejs build-essential
  sudo npm install -g pm2
  mkdir -p ~/apex-bank
"

# 6. Transfer Files
echo "📤 Transferring application files..."
# We use a temporary tarball to make the transfer faster over gcloud scp
tar -czf app.tar.gz --exclude='node_modules' --exclude='dist' --exclude='.git' .
gcloud compute scp app.tar.gz $INSTANCE_NAME:~/apex-bank/ --zone=$ZONE
rm app.tar.gz

# 7. Build and Launch
echo "🚀 Building and Launching Application..."
gcloud compute ssh $INSTANCE_NAME --zone=$ZONE --command="
  cd ~/apex-bank
  tar -xzf app.tar.gz
  
  # Install dependencies
  npm install
  
  # Build the frontend
  # We pass the API key during build as well for Vite
  VITE_GEMINI_API_KEY=$GEMINI_API_KEY npm run build
  
  # Start with PM2
  pm2 delete apex-bank || true
  
  # Start the app
  NODE_ENV=production GEMINI_API_KEY=$GEMINI_API_KEY PORT=3000 \
  pm2 start 'node --experimental-strip-types backend/server.ts' --name 'apex-bank'
  
  # Persistence
  pm2 save
  sudo env PATH=\$PATH:/usr/bin pm2 startup systemd -u \$USER --hp ~
"

# 8. Get the Public IP
PUBLIC_IP=$(gcloud compute instances describe $INSTANCE_NAME --zone=$ZONE --format='get(networkInterfaces[0].accessConfigs[0].natIP)')

echo "------------------------------------------------"
echo "✅ INFRASTRUCTURE & APP DEPLOYED SUCCESSFULLY!"
echo "🔗 App URL: http://$PUBLIC_IP:3000"
echo "------------------------------------------------"
echo "⚠️  IMPORTANT: Browsers block Microphone/Camera on HTTP."
echo "To test on this IP, you must enable this flag in Chrome:"
echo "chrome://flags/#unsafely-treat-insecure-origin-as-secure"
echo "Add 'http://$PUBLIC_IP:3000' to the list and restart Chrome."
echo "------------------------------------------------"