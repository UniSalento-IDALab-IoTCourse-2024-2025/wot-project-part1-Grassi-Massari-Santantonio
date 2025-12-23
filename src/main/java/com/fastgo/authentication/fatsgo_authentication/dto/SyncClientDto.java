package com.fastgo.authentication.fatsgo_authentication.dto;

public class SyncClientDto {

    
    private String token;
    private ClientDto clientDto;

    public String getToken() {
        return token;
    }
    public void setToken(String token) {
        this.token = token;
    }

     public ClientDto getClientDto() {
        return clientDto;
    }
    public void setClientDto(ClientDto clientDto) {
        this.clientDto=clientDto;
    }


   
}
