package com.fastgo.authentication.fatsgo_authentication.restControllers;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import com.fastgo.authentication.fatsgo_authentication.dto.ClientDto;
import com.fastgo.authentication.fatsgo_authentication.dto.RegistrationResultDTO;
import com.fastgo.authentication.fatsgo_authentication.dto.RiderDto;
import com.fastgo.authentication.fatsgo_authentication.dto.ShopKeeperDto;
import com.fastgo.authentication.fatsgo_authentication.dto.VehicleDto;
import com.fastgo.authentication.fatsgo_authentication.service.RegistrationService;
import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.fastgo.authentication.fatsgo_authentication.domain.Role;
import com.fastgo.authentication.fatsgo_authentication.domain.User;
import com.fastgo.authentication.fatsgo_authentication.domain.Vehicle;


import org.springframework.http.HttpHeaders;



@RestController
@RequestMapping("/registration")
public class RegistrationRestControllers {

    @Autowired
    private RegistrationService registrationService;

    @Autowired
    private Cloudinary cloudinary;  


    @PostMapping(value = "/client", produces = MediaType.APPLICATION_JSON_VALUE, consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<RegistrationResultDTO> saveClient(@RequestBody ClientDto userDTO) {

        ResponseEntity<RegistrationResultDTO> responseEntity = registrationService
                .checkCredentials(userDTO.getEmail(), userDTO.getUsername());
        if (!responseEntity.getStatusCode().is2xxSuccessful()) {
            return responseEntity;
        }

        User newUser = registrationService.registerNewUser(
                userDTO.getEmail(),
                userDTO.getUsername(),
                userDTO.getPassword(),
                userDTO.getName(),
                userDTO.getLastName(),
                userDTO.getPictureUrl(),
                Role.USER
        );

        userDTO.setPassword("");
        userDTO.setId(newUser.getId());

        RegistrationResultDTO registrationResultDTO = new RegistrationResultDTO();
        registrationResultDTO.setResult(RegistrationResultDTO.OK);
        registrationResultDTO.setMessage("Client registration successful");

        registrationService.synchronizeClient(userDTO);
        
        return new ResponseEntity<>(registrationResultDTO, HttpStatus.OK);
    }

    @PostMapping(value = "/rider", produces = MediaType.APPLICATION_JSON_VALUE, consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<RegistrationResultDTO> saveRider(@RequestBody RiderDto userDTO) {

        ResponseEntity<RegistrationResultDTO> responseEntity = registrationService
                .checkCredentials(userDTO.getEmail(), userDTO.getUsername());
        if (!responseEntity.getStatusCode().is2xxSuccessful()) {
            return responseEntity;
        }

        User newUser = registrationService.registerNewUser(
                userDTO.getEmail(),
                userDTO.getUsername(),
                userDTO.getPassword(),
                userDTO.getName(),
                userDTO.getLastName(),
                userDTO.getPictureUrl(),
                Role.RIDER
        );

        userDTO.setPassword("");
        userDTO.setId(newUser.getId());

        RegistrationResultDTO registrationResultDTO = new RegistrationResultDTO();
        registrationResultDTO.setResult(RegistrationResultDTO.OK);
        registrationResultDTO.setMessage("Rider registration successful");

        registrationService.synchronizeRider(userDTO);

        return new ResponseEntity<>(registrationResultDTO, HttpStatus.OK);
    }

    @PostMapping(value = "/shopkeeper", produces = MediaType.APPLICATION_JSON_VALUE, consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<RegistrationResultDTO> saveShopKeeper(@RequestBody ShopKeeperDto userDTO) {

        ResponseEntity<RegistrationResultDTO> responseEntity = registrationService
                .checkCredentials(userDTO.getEmail(), userDTO.getUsername());
        if (!responseEntity.getStatusCode().is2xxSuccessful()) {
            return responseEntity;
        }

        User newUser = registrationService.registerNewUser(
                userDTO.getEmail(),
                userDTO.getUsername(),
                userDTO.getPassword(),
                userDTO.getName(),
                userDTO.getLastName(),
                userDTO.getPictureUrl(),
                Role.SHOPKEEPER
        );

        userDTO.setPassword("");
        userDTO.setId(newUser.getId());

        RegistrationResultDTO registrationResultDTO = new RegistrationResultDTO();
        registrationResultDTO.setResult(RegistrationResultDTO.OK);
        registrationResultDTO.setMessage("ShopKeeper registration successful");

        registrationService.synchronizeShopKeeper(userDTO);

        return new ResponseEntity<>(registrationResultDTO, HttpStatus.OK);
    }

    @GetMapping("/status")
    public ResponseEntity<String> getServiceStatus() {
        return new ResponseEntity<>("Registration Service is running!", HttpStatus.OK);
    }

    @GetMapping("/vehicles")
    public ResponseEntity<List<VehicleDto>> getVehicles() {
        List<VehicleDto> vehicles = Arrays.stream(Vehicle.values())
                .map(vehicle -> new VehicleDto(
                        vehicle.name(), 
                        formatLabel(vehicle.name()) 
                ))
                .collect(Collectors.toList());

        return ResponseEntity.ok(vehicles);
    }

    
    private String formatLabel(String source) {
        if (source == null || source.isEmpty()) {
            return source;
        }
        return source.substring(0, 1).toUpperCase() + source.substring(1).toLowerCase();
    }

    @PostMapping("/upload")
    public ResponseEntity<Map<String, String>> uploadFile(@RequestParam("file") MultipartFile file, @RequestParam("username") String username) {
        try {
            //System.out.println("Richiesta ricevuta");
            String originalFilename = file.getOriginalFilename();
            String fileExtension = originalFilename != null ? originalFilename.substring(originalFilename.lastIndexOf('.') + 1) : "jpg";

            
            String publicId = username + "/userprofile." + fileExtension;
            @SuppressWarnings("unchecked")
            Map<String, Object> uploadParams = ObjectUtils.asMap(
                "public_id", publicId,
                "overwrite", true
            );
            // Carica il file su Cloudinary
            @SuppressWarnings("unchecked")
            Map<String, Object> uploadResult = (Map<String, Object>) cloudinary.uploader().upload(file.getBytes(), uploadParams);
            
            // Ottieni l'URL pubblico del file caricato
            String imageUrl = (String) uploadResult.get("url");
    
            // Ritorna la risposta con l'URL del file caricato
            Map<String, String> response = new HashMap<>();
            response.put("imageUrl", imageUrl);
            return ResponseEntity.ok(response);
        } catch (java.io.IOException e) {  
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                 .body(Map.of("message", "Errore nel salvataggio su Cloudinary"));
        }
    }


    @GetMapping("/geocode")
    public ResponseEntity<?> geocodeAddress(@RequestParam("query") String query) {
        try {
            
            String encodedQuery = URLEncoder.encode(query, StandardCharsets.UTF_8);
            String url = "https://nominatim.openstreetmap.org/search?format=json&q=" + encodedQuery + "&addressdetails=1&limit=5&countrycodes=it";

            
            RestTemplate restTemplate = new RestTemplate();
            HttpHeaders headers = new HttpHeaders();
            headers.set("User-Agent", "FastGo-App-IoT-Project"); 
            HttpEntity<String> entity = new HttpEntity<>("parameters", headers);

            
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.GET, entity, String.class);

            
            return ResponseEntity.ok(response.getBody());

        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Errore nel geocoding: " + e.getMessage());
        }
    }

    @GetMapping("/picture")
    public ResponseEntity<?> getPictureUrl(@RequestHeader("Authorization") String token) {
        System.out.println("Ricevuta richiesta per ottenere l'URL dell'immagine con token: " + token);
        return registrationService.getPictureUrlFromToken(token);
    }
}