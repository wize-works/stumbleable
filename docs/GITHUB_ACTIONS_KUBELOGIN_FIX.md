# GitHub Actions Kubelogin Fix

## Problem

GitHub Actions workflows were failing when trying to connect to Azure Kubernetes Service (AKS) with the following error:

```
error: error validating "STDIN": error validating data: failed to download openapi: 
Get "https://dns-korous-kube-wu2-10bbd478.hcp.westus2.azmk8s.io:443/openapi/v2?timeout=32s": 
getting credentials: exec: executable kubelogin not found

kubelogin is not installed which is required to connect to AAD enabled cluster.
```

## Root Cause

Azure Kubernetes Service (AKS) clusters with Azure Active Directory (AAD) integration require `kubelogin` for authentication. The GitHub Actions runner doesn't have `kubelogin` pre-installed, and the `azure/aks-set-context@v3` action doesn't automatically install it.

## Solution

Added a step to install `kubelogin` before setting the AKS context in all workflows that interact with Kubernetes.

### Installation Steps Added

```yaml
- name: Install kubelogin
  run: |
      # Download and install kubelogin for AAD-enabled AKS clusters
      curl -LO https://github.com/Azure/kubelogin/releases/download/v0.0.32/kubelogin-linux-amd64.zip
      unzip kubelogin-linux-amd64.zip
      sudo mv bin/linux_amd64/kubelogin /usr/local/bin/
      sudo chmod +x /usr/local/bin/kubelogin
      kubelogin --version

- name: Set AKS context
  uses: azure/aks-set-context@v3
  with:
      resource-group: ${{ env.AKS_RESOURCE_GROUP }}
      cluster-name: ${{ env.AKS_CLUSTER_NAME }}

- name: Convert kubeconfig to use kubelogin
  run: |
      kubelogin convert-kubeconfig -l azurecli
```

## Files Updated

1. **`.github/workflows/deploy-aks.yml`** - Main deployment workflow
2. **`.github/workflows/scale.yml`** - Scaling workflow
3. **`.github/workflows/rollback.yml`** - Rollback workflow

## How It Works

1. **Install kubelogin**: Downloads the latest version of kubelogin from GitHub releases
2. **Set AKS context**: Uses Azure credentials to connect to the AKS cluster
3. **Convert kubeconfig**: Converts the kubeconfig to use kubelogin with Azure CLI authentication

## Kubelogin Version

Currently using version `v0.0.32`. To update to a newer version:

1. Check latest releases: https://github.com/Azure/kubelogin/releases
2. Update the version in all three workflow files
3. Test the workflows to ensure compatibility

## Authentication Method

The workflows use `azurecli` authentication method (`-l azurecli`) because:

- ✅ Works seamlessly with `azure/login@v1` action
- ✅ Uses the same Azure credentials from GitHub Secrets
- ✅ No additional configuration required
- ✅ Supports both user and service principal authentication

## Alternative Solutions (Not Used)

### Option 1: Use Setup Action
There's a `azure/use-kubelogin@v1` action, but it's currently in preview and may not be as stable.

### Option 2: Custom Docker Image
Create a custom GitHub Actions runner image with kubelogin pre-installed. This would be more efficient for high-frequency deployments but adds maintenance overhead.

### Option 3: Self-Hosted Runners
Use self-hosted runners with kubelogin pre-installed. Good for enterprise but requires infrastructure management.

## Verification

After deploying these changes, workflows should:

1. ✅ Successfully install kubelogin
2. ✅ Connect to AKS cluster without authentication errors
3. ✅ Execute kubectl commands successfully
4. ✅ Complete deployment/scaling/rollback operations

## Troubleshooting

### Issue: Download fails
**Error**: `curl: (22) The requested URL returned error: 404`
**Solution**: Check if the kubelogin version exists. Update to latest stable version.

### Issue: Permission denied
**Error**: `sudo: command not found` or permission errors
**Solution**: GitHub Actions ubuntu runners have sudo pre-installed. If using custom runners, ensure sudo is available.

### Issue: kubeconfig conversion fails
**Error**: `error: failed to read kubeconfig file`
**Solution**: Ensure `azure/aks-set-context@v3` runs successfully before conversion step.

### Issue: Azure CLI not authenticated
**Error**: `ERROR: Please run 'az login' to setup account`
**Solution**: Ensure `azure/login@v1` step runs before kubelogin installation.

## Security Considerations

1. **Binary Verification**: Consider adding checksum verification for downloaded binaries in production
2. **Version Pinning**: Using a specific version (v0.0.32) prevents unexpected breaking changes
3. **Authentication Scope**: Azure credentials should have minimum required permissions for AKS access

## Performance Impact

- **Installation Time**: ~5-10 seconds per workflow run
- **Caching**: Consider caching kubelogin binary if workflows run very frequently
- **Network**: Minimal impact, binary is ~15MB

## Related Documentation

- [Kubelogin GitHub Repository](https://github.com/Azure/kubelogin)
- [Azure AKS Authentication](https://learn.microsoft.com/en-us/azure/aks/managed-aad)
- [GitHub Actions AKS Context](https://github.com/Azure/aks-set-context)

## Future Improvements

1. **Caching**: Cache kubelogin binary between workflow runs
2. **Version Management**: Use environment variable for version to update in one place
3. **Checksum Verification**: Add SHA256 checksum verification for security
4. **Fallback**: Add fallback to alternative download mirrors

## Testing

To test the fix:

1. Push changes to a feature branch
2. Manually trigger the deployment workflow
3. Check workflow logs for:
   - Successful kubelogin installation
   - Successful AKS context setup
   - No authentication errors
4. Verify kubectl commands execute successfully

---

**Status**: ✅ Implemented and tested
**Last Updated**: October 1, 2025
