CREATE TABLE IF NOT EXISTS prompt_presets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  prompt text NOT NULL,
  preview_image_url text,
  disabled boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

INSERT INTO prompt_presets (name, prompt, disabled) VALUES 
('Hairdresser', 'Please generate a nine-panel layout of this character''s avatar, each with a different hairstyle.', false),
('Passport photo', 'Generate a photo based on the given image, for passport usage. The subject faces the camera, wearing formal clothing, indoors with office lighting, captured by a DSLR, plain light-gray background, even lighting.', false),
('Bobblehead', 'Turn this photo into a bobblehead: enlarge the head slightly, keep the face accurate and cartoonify the body. Place it on a bookshelf.', false);