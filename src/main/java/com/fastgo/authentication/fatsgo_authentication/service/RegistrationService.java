package com.fastgo.authentication.fatsgo_authentication.service;

import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Async;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.fastgo.authentication.fatsgo_authentication.domain.Role;
import com.fastgo.authentication.fatsgo_authentication.domain.State;
import com.fastgo.authentication.fatsgo_authentication.domain.User;
import com.fastgo.authentication.fatsgo_authentication.dto.ClientDto;
import com.fastgo.authentication.fatsgo_authentication.dto.PictureUrlDto;
import com.fastgo.authentication.fatsgo_authentication.dto.RegistrationResultDTO;
import com.fastgo.authentication.fatsgo_authentication.dto.RiderDto;
import com.fastgo.authentication.fatsgo_authentication.dto.ShopKeeperDto;
import com.fastgo.authentication.fatsgo_authentication.dto.SyncClientDto;
import com.fastgo.authentication.fatsgo_authentication.dto.SyncRiderDto;
import com.fastgo.authentication.fatsgo_authentication.dto.SyncShopDto;
import com.fastgo.authentication.fatsgo_authentication.repositories.UserRepository;
import com.fastgo.authentication.fatsgo_authentication.security.JwtUtilities;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;


@Service
public class RegistrationService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private CustomUserDetailsService customUserDetailsService;

    private static final Logger log = LoggerFactory.getLogger(RegistrationService.class);

   
    @Autowired
    private RabbitTemplate rabbitTemplate;

    @Autowired
    private JwtUtilities jwtUtilities;


    
    @Value("${rabbitmq.exchange.sync:sync-exchange}")
    private String syncExchange;


    private final String ROUTING_KEY_RIDER_SYNC = "rider.sync.request";
    private final String ROUTING_KEY_SHOP_SYNC = "shop.sync.request";
    private final String ROUTING_KEY_CLIENT_SYNC = "client.sync.request";


    public ResponseEntity<RegistrationResultDTO> checkCredentials(String email, String username) {
        return customUserDetailsService.checkCredentials(email, username);
    }

  
    public User registerNewUser(String email, String username, String password, String name, String lastName, String pictureUrl, Role role) {
        
        User newUser = new User();
        newUser.setUsername(username);
        newUser.setEmail(email);
        newUser.setPassword(passwordEncoder.encode(password));
        newUser.setRole(role);
        newUser.setStatus(State.ACTIVE);
        newUser.setPictureUrl(pictureUrl);
        if (Role.USER.equals(role)) {
            newUser.setSynchronized(true);
            
        }else {
            newUser.setSynchronized(false);
        }
        newUser.setName(name);
        newUser.setLastName(lastName);

       
        return userRepository.save(newUser);
    }

    @SuppressWarnings("null")
    @Async
    public void synchronizeRider(RiderDto riderDto) {
        log.info("Tentativo di sincronizzazione per l'utente ID: {}", riderDto.getId());

        try {

            User user = userRepository.findById(riderDto.getId())
                    .orElseThrow(() -> new RuntimeException("Utente non trovato per la sincronizzazione: " + riderDto.getId()));

            Map<String, Object> claims = new HashMap<>();
            claims.put("userId", user.getId());
            claims.put("role", user.getRole().toString());
            final String jwt = jwtUtilities.generateToken(user.getUsername(), claims);

            SyncRiderDto syncRiderDto = new SyncRiderDto();
            syncRiderDto.setToken(jwt);
            syncRiderDto.setRider(riderDto);
            
            Object response = rabbitTemplate.convertSendAndReceive(
                    syncExchange,
                    ROUTING_KEY_RIDER_SYNC,
                    syncRiderDto
            );

            if (response != null && "OK".equals(response.toString())) {
                log.info("Sincronizzazione confermata per l'utente ID: {}. Aggiorno il DB.", riderDto.getId());
                
                user.setSynchronized(true);
                userRepository.save(user);

            } else {
                log.warn("Sincronizzazione fallita per l'utente ID: {}. Risposta ricevuta: {}", riderDto.getId(), response);
                //invio email di notifica all'utente
               
                    String userEmail = user.getEmail();
                    //invio email
                    userRepository.delete(user);
                
            }

        } catch (Exception e) {
            log.error("Errore durante la chiamata RPC di RabbitMQ per l'utente ID: " + riderDto.getId(), e);
             userRepository.findById(riderDto.getId()).ifPresent(user -> {
                    
                    String userEmail = user.getEmail();
                    //invio email
                    userRepository.delete(user);
                });
        }
    }

    @SuppressWarnings("null")
    @Async
    public void synchronizeShopKeeper(ShopKeeperDto shopKeeperDto) {
        log.info("Tentativo di sincronizzazione per il venditore ID: {}", shopKeeperDto.getId());

        try {

            User user = userRepository.findById(shopKeeperDto.getId())
                    .orElseThrow(() -> new RuntimeException("Utente non trovato per la sincronizzazione: " + shopKeeperDto.getId()));


            Map<String, Object> claims = new HashMap<>();
            claims.put("userId", shopKeeperDto.getId());
            claims.put("role", shopKeeperDto.getRole().toString());
            final String jwt = jwtUtilities.generateToken(shopKeeperDto.getUsername(), claims);

            SyncShopDto syncShopDto = new SyncShopDto();
            syncShopDto.setToken(jwt);
            syncShopDto.setShop(shopKeeperDto);

            Object response = rabbitTemplate.convertSendAndReceive(
                    syncExchange,
                    ROUTING_KEY_SHOP_SYNC,
                    syncShopDto
            );

            if (response != null && "OK".equals(response.toString())) {
                log.info("Sincronizzazione confermata per l'utente ID: {}. Aggiorno il DB.", shopKeeperDto.getId());
                
               
                user.setSynchronized(true);
                userRepository.save(user);

            } else {
                log.warn("Sincronizzazione fallita per l'utente ID: {}. Risposta ricevuta: {}", shopKeeperDto.getId(), response);
                //invio email di notifica all'utente
                    String userEmail = user.getEmail();
                    //invio email
                    userRepository.delete(user);
               
            }

        } catch (Exception e) {
            log.error("Errore durante la chiamata RPC di RabbitMQ per l'utente ID: " + shopKeeperDto.getId(), e);
             userRepository.findById(shopKeeperDto.getId()).ifPresent(user -> {
                    
                    String userEmail = user.getEmail();
                    //invio email
                    userRepository.delete(user);
                });
        }
    }


        @SuppressWarnings("null")
    @Async
    public void synchronizeClient(ClientDto clientDto) {
        log.info("Tentativo di sincronizzazione per il venditore ID: {}", clientDto.getId());

        try {

            User user = userRepository.findById(clientDto.getId())
                    .orElseThrow(() -> new RuntimeException("Utente non trovato per la sincronizzazione: " + clientDto.getId()));


            Map<String, Object> claims = new HashMap<>();
            claims.put("userId", clientDto.getId());
            claims.put("role", clientDto.getRole().toString());
            final String jwt = jwtUtilities.generateToken(clientDto.getUsername(), claims);

            SyncClientDto syncClientDto = new SyncClientDto();
            syncClientDto.setToken(jwt);
            syncClientDto.setClientDto(clientDto);

            Object response = rabbitTemplate.convertSendAndReceive(
                    syncExchange,
                    ROUTING_KEY_CLIENT_SYNC,
                    syncClientDto
            );

            if (response != null && "OK".equals(response.toString())) {
                log.info("Sincronizzazione confermata per l'utente ID: {}. Aggiorno il DB.", clientDto.getId());
                
               
                user.setSynchronized(true);
                userRepository.save(user);

            } else {
                log.warn("Sincronizzazione fallita per l'utente ID: {}. Risposta ricevuta: {}", clientDto.getId(), response);
                //invio email di notifica all'utente
                    String userEmail = user.getEmail();
                    //invio email
                    userRepository.delete(user);
               
            }

        } catch (Exception e) {
            log.error("Errore durante la chiamata RPC di RabbitMQ per l'utente ID: " + clientDto.getId(), e);
             userRepository.findById(clientDto.getId()).ifPresent(user -> {
                    
                    String userEmail = user.getEmail();
                    //invio email
                    userRepository.delete(user);
                });
        }
    }


    public ResponseEntity<?> getPictureUrlFromToken(String token) {
        token = token.replace("Bearer ", "");
        String username = jwtUtilities.extractUsername(token);
        if(jwtUtilities.validateToken(token, username)) {
            Optional<User> user = userRepository.findByUsername(username);
            if (user.isPresent() && user.get().getPictureUrl() != null) {
                PictureUrlDto pictureUrlDto = new PictureUrlDto(user.get().getPictureUrl());
                return ResponseEntity.ok(pictureUrlDto);
            } else {
                return ResponseEntity.status(404).body("Utente non trovato o immagine non disponibile");
            }
        } 
        throw new UnsupportedOperationException("Unimplemented method 'getPictureUrlFromToken'");
    }

}