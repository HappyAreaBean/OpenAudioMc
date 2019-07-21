package com.craftmend.openaudiomc.services.networking.addapter;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class RestDataResponse {

    private List<RelayHost> assignedEndpoints;
    private String privateKey;
    private String publicKey;

    public RelayHost findInsecureRelay() {
        for (RelayHost assignedEndpoint : assignedEndpoints) {
            if (!assignedEndpoint.getSecure()) return assignedEndpoint;
        }

        return null;
    }

}
