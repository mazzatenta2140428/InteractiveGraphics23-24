var raytraceFS = `
struct Ray {
    vec3 pos;
    vec3 dir;
};

struct Material {
    vec3  k_d;    
    vec3  k_s;    
    float n;      
};

struct Sphere {
    vec3     center;
    float    radius;
    Material mtl;
};

struct Light {
    vec3 position;
    vec3 intensity;
};

struct HitInfo {
    float    t;
    vec3     position;
    vec3     normal;
    Material mtl;
};

uniform Sphere spheres[NUM_SPHERES];
uniform Light  lights[NUM_LIGHTS];
uniform samplerCube envMap;
uniform int bounceLimit;


// Intersects the given ray with all spheres in the scene
// and updates the given HitInfo using the information of the sphere
// that first intersects with the ray.
// Returns true if an intersection is found.
bool IntersectRay(inout HitInfo hit, Ray ray) {
    hit.t = 1e30;
    bool foundHit = false;

    for (int i = 0; i < NUM_SPHERES; ++i) {
        Sphere sphere = spheres[i];
        vec3 oc = ray.pos - sphere.center;
        float a = dot(ray.dir, ray.dir);
        float b = 2.0 * dot(oc, ray.dir);
        float c = dot(oc, oc) - (sphere.radius * sphere.radius);
        float discriminant = b * b - 4.0 * a * c;

        if (discriminant >= 0.0) {
            float t = (-b - sqrt(discriminant)) / (2.0 * a);
            if (t > 0.0 && t <= hit.t) {
                
                hit.t = t;
                hit.position = ray.pos + ray.dir * t;
                hit.normal = normalize(hit.position - sphere.center);
                hit.mtl = sphere.mtl;
				foundHit = true;
            }
        }
    }
    return foundHit;
}

// Shades the given point and returns the computed color.
vec3 Shade(Material mtl, vec3 position, vec3 normal, vec3 view) {
    vec3 color = vec3(0, 0, 0);

    for (int i = 0; i < NUM_LIGHTS; ++i) {
        Ray surfaceToLightRay;
        surfaceToLightRay.dir = normalize(lights[i].position - position);
        surfaceToLightRay.pos = position;

        bool foundHit = false;
        for (int j = 0; j < NUM_SPHERES; ++j) {
            Sphere sphere = spheres[j];
            vec3 oc = surfaceToLightRay.pos - sphere.center;
            float a = dot(surfaceToLightRay.dir, surfaceToLightRay.dir);
            float b = 2.0 * dot(oc, surfaceToLightRay.dir);
            float c = dot(oc, oc) - sphere.radius * sphere.radius;
            float delta = b * b - 4.0 * a * c;

            if (delta >= 0.0) {
                float t = (-b - sqrt(delta)) / (2.0 * a);
                if (t > 0.0) {
                    foundHit = true;
                    break;
                }
            }
        }

        if (!foundHit) {
            vec3 lightDir = normalize(lights[i].position - position);
            vec3 h = normalize(view + lightDir);
            float diffuseComponent = max(dot(normal, lightDir), 0.0); 
        
            float specularComponent = pow(max(dot(normal, h), 0.0), mtl.n);
            
            color += (mtl.k_d *diffuseComponent + mtl.k_s *specularComponent) * lights[i].intensity;
        }
    }
    return color;
}

// Given a ray, returns the shaded color where the ray intersects a sphere.
// If the ray does not hit a sphere, returns the environment color.
vec4 RayTracer(Ray ray) {
    HitInfo hit;
    if (IntersectRay(hit, ray)) {
        vec3 view = normalize(-ray.dir);
        vec3 clr = Shade(hit.mtl, hit.position, hit.normal, view);
        
        vec3 k_s = hit.mtl.k_s;
        for (int bounce = 0; bounce < MAX_BOUNCES; ++bounce) {
            if (bounce >= bounceLimit) break;
            if (k_s.r + k_s.g + k_s.b <= 0.0) break;
            
            Ray r;
            HitInfo h;

            r.dir = reflect(normalize(ray.dir), hit.normal);
            r.pos = hit.position + r.dir * 0.0001;
            
            if (IntersectRay(h, r)) {
                clr += Shade(h.mtl, h.position, h.normal, view);
                hit = h;
                ray = r;
            } else {
                clr += k_s * textureCube(envMap, r.dir.xzy).rgb ;
                break;
            }
        }
        
        return vec4(clr, 1);
    } else {
        return vec4(textureCube(envMap, ray.dir.xzy).rgb, 0);
    }
}
`;
