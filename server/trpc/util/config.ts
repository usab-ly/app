export const serviceAccount = {
  type: process.env.NODE_type,
  project_id: process.env.NODE_project_id,
  private_key_id: process.env.NODE_private_key_id,
  private_key: process.env.NODE_private_key
    ? process.env.NODE_private_key.replace(/\\n/g, '\n')
    : '',
  client_email: process.env.NODE_client_email,
  client_id: process.env.NODE_client_id,
  auth_uri: process.env.NODE_auth_uri,
  token_uri: process.env.NODE_token_uri,
  auth_provider_x509_cert_url: process.env.NODE_auth_provider_x509_cert_url,
  client_x509_cert_url: process.env.NODE_client_x509_cert_url,
  universe_domain: process.env.NODE_universe_domain,
};
